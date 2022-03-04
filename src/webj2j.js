"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.createIVWithPassword = void 0;
const streamsaver_1 = __importDefault(require("streamsaver"));
const J2J_VALUE = 10240000;
const J2J_FOOTER_SIZE = 32;
function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}
function stringToBytes(string) {
    return new TextEncoder().encode(string);
}
function parseFooter(footer2) {
    let footer = new Uint8Array(footer2);
    if (footer.slice(0, 8).reduce((a, b) => a + b) != 0) {
        return;
    }
    let blockCount = footer[8];
    if (footer.slice(9, 16).reduce((a, b) => a + b) != 0) {
        return;
    }
    let crc = parseInt(bytesToString(footer.slice(16, 24)), 16);
    if (bytesToString(footer.slice(24, 32)) != 'L3000009') {
        return;
    }
    return {
        blockCount,
        crc
    };
}
function createIV() {
    let iv = new Uint8Array(J2J_VALUE);
    for (let i = 0; i <= J2J_VALUE; i++) {
        iv[i] = i % 256;
    }
    return iv;
}
function createIVWithPassword(password2) {
    let iv = createIV();
    let password = stringToBytes(password2);
    let skip = false;
    let skipCount = 0;
    let passwordIndex = 0;
    for (let i = 0; i < J2J_VALUE; i++) {
        if (skip) {
            skip = false;
            skipCount++;
            continue;
        }
        if (skipCount >= password.length) {
            skipCount = 0;
            i += 1;
        }
        skip = true;
        iv[i] += password[passwordIndex++];
        if (passwordIndex >= password.length) {
            passwordIndex = 0;
        }
    }
    return iv;
}
exports.createIVWithPassword = createIVWithPassword;
function decrypt(file, password, outputName) {
    return __awaiter(this, void 0, void 0, function* () {
        let filesize = file.size;
        let footer = yield file.slice(filesize - J2J_FOOTER_SIZE).arrayBuffer();
        let footer_info = parseFooter(footer);
        if (!footer_info) {
            alert('J2J 파일이 아닙니다.');
            return;
        }
        let chunk_size = 10240000;
        let blockCount = Math.max(Math.floor(J2J_VALUE / (filesize * 100)), 1);
        let iv;
        if (password == '') {
            iv = createIV();
        }
        else {
            iv = createIVWithPassword(password);
        }
        let stream = streamsaver_1.default.createWriteStream(outputName, {
            size: filesize - J2J_FOOTER_SIZE
        });
        const writer = stream.getWriter();
        for (let c = 0; c < blockCount; c++) {
            let start = c * J2J_VALUE;
            let end = start + J2J_VALUE;
            let remain = end - start;
            let idx = 0;
            while (remain > 0) {
                let ee = start + chunk_size;
                if (ee > end) {
                    ee = end;
                }
                let chunk = new Uint8Array(yield file.slice(start, ee).arrayBuffer());
                for (let i = 0; i < chunk.byteLength; i++) {
                    chunk[i] ^= iv[idx];
                    iv[idx] ^= chunk[i];
                    idx += 1;
                }
                start += chunk.byteLength;
                remain -= chunk.byteLength;
                yield writer.write(chunk);
            }
        }
        {
            let start = blockCount * J2J_VALUE;
            let end = filesize - blockCount * J2J_VALUE - J2J_FOOTER_SIZE;
            let remain = end - start;
            while (remain > 0) {
                let ee = start + chunk_size;
                if (ee > end) {
                    ee = end;
                }
                let chunk = new Uint8Array(yield file.slice(start, ee).arrayBuffer());
                remain -= ee - start;
                start += chunk.byteLength;
                yield writer.write(chunk);
            }
        }
        for (let c = 0; c < blockCount; c++) {
            let start = filesize - blockCount * J2J_VALUE - J2J_FOOTER_SIZE + c * J2J_VALUE;
            let end = filesize - blockCount * J2J_VALUE - J2J_FOOTER_SIZE + c * J2J_VALUE + J2J_VALUE;
            let remain = end - start;
            let idx = 0;
            while (remain > 0) {
                let ee = start + chunk_size;
                if (ee > end) {
                    ee = end;
                }
                let chunk = new Uint8Array(yield file.slice(start, ee).arrayBuffer());
                for (let i = 0; i < chunk.byteLength; i++) {
                    chunk[i] ^= iv[idx];
                    iv[idx] ^= chunk[i];
                    idx += 1;
                }
                start += chunk.byteLength;
                remain -= chunk.byteLength;
                yield writer.write(chunk);
            }
        }
        writer.close();
    });
}
exports.decrypt = decrypt;
