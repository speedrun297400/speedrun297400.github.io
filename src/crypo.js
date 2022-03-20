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
exports.Decrypt = exports.Encrypt = void 0;
const sha3_1 = __importDefault(require("sha3"));
const aes_js_1 = require("aes-js");
const bson_1 = require("bson");
const crypto_1 = require("crypto");
function hashKey(params) {
    const key = new sha3_1.default(256);
    key.update(params);
    key.update(key.digest.toString() + key);
    return key.digest();
}
function CreateKey(key, salt) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = hashKey(key + salt.toString('base64'));
        return yield crypto.subtle.importKey("raw", keys, 'AES-CTR', false, ["encrypt", "decrypt"]);
    });
}
const ctr = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5]);
function EncryptOld(file, key) {
    const salt = (0, crypto_1.randomBytes)(16);
    const keys = hashKey(key + salt.toString('base64'));
    const aesCtr = new aes_js_1.ModeOfOperation.ctr(keys, new aes_js_1.Counter(ctr));
    const returnFile = aesCtr.encrypt(file);
    const d = (0, bson_1.serialize)({ data: returnFile, salt: salt });
    console.log(d.length);
    return d;
}
function Encrypt(file, key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!window.crypto || !window.crypto.subtle) {
            return EncryptOld(file, key);
        }
        const salt = (0, crypto_1.randomBytes)(16);
        const keycrypto = yield CreateKey(key, salt);
        const returnFilex = yield window.crypto.subtle.encrypt({
            name: "AES-CTR",
            counter: ctr,
            length: 64
        }, keycrypto, file);
        const returnFile = new Uint8Array(returnFilex);
        const d = (0, bson_1.serialize)({ data: returnFile, salt: salt });
        console.log(d.length);
        return d;
    });
}
exports.Encrypt = Encrypt;
function Decrypt(file, key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!window.crypto || !window.crypto.subtle) {
            return DecryptOld(file, key);
        }
        const f = (0, bson_1.deserialize)(file);
        if (f.data === null || f.salt === null) {
            throw 'data is null';
        }
        const salt = f.salt.buffer;
        const keycrypto = yield CreateKey(key, salt);
        return new Uint8Array(yield window.crypto.subtle.decrypt({
            name: "AES-CTR",
            counter: ctr,
            length: 64
        }, keycrypto, f.data.buffer));
    });
}
exports.Decrypt = Decrypt;
function DecryptOld(file, key) {
    const f = (0, bson_1.deserialize)(file);
    if (f.data === null || f.salt === null) {
        throw 'data is null';
    }
    const MainFile = f.data.buffer;
    const salt = f.salt.buffer;
    const keys = hashKey(key + salt.toString('base64'));
    const aesCtr = new aes_js_1.ModeOfOperation.ctr(keys, new aes_js_1.Counter(ctr));
    const returnFile = aesCtr.decrypt(MainFile);
    return returnFile;
}
