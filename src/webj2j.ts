import streamSaver from "streamsaver"
const J2J_VALUE = 10240000;
const J2J_FOOTER_SIZE = 32;

function bytesToString(bytes:Uint8Array) {
    return new TextDecoder().decode(bytes);
}
function stringToBytes(string:string) {
    return new TextEncoder().encode(string);
}
function parseFooter(footer2:ArrayBuffer) {
    let footer = new Uint8Array(footer2);
    if (footer.slice(0, 8).reduce((a:number, b:number) => a + b) != 0) {
        return;
    }
    let blockCount = footer[8];
    if (footer.slice(9, 16).reduce((a:number, b:number) => a + b) != 0) {
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


export function createIVWithPassword(password2:string) {
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
export async function decrypt(file: File, password:string, outputName:string) {
    let filesize = file.size;
    let footer = await file.slice(filesize - J2J_FOOTER_SIZE).arrayBuffer();
    let footer_info = parseFooter(footer);
    if (!footer_info) {
        alert('J2J 파일이 아닙니다.');
        return;
    }
    let chunk_size = 10240000;
    let blockCount = Math.max(Math.floor(J2J_VALUE / (filesize * 100)), 1);
    let iv: Uint8Array;
    if (password == '') {
        iv = createIV();
    } else {
        iv = createIVWithPassword(password);
    }
    let stream = streamSaver.createWriteStream(outputName, {
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
            let chunk = new Uint8Array(await file.slice(start, ee).arrayBuffer());
            for (let i = 0; i < chunk.byteLength; i++) {
                chunk[i] ^= iv[idx];
                iv[idx] ^= chunk[i];
                idx += 1;
            }
            start += chunk.byteLength;
            remain -= chunk.byteLength
            await writer.write(chunk);
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
            let chunk = new Uint8Array(await file.slice(start, ee).arrayBuffer());
            remain -= ee - start;
            start += chunk.byteLength;
            await writer.write(chunk);
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
            let chunk = new Uint8Array(await file.slice(start, ee).arrayBuffer());
            for (let i = 0; i < chunk.byteLength; i++) {
                chunk[i] ^= iv[idx];
                iv[idx] ^= chunk[i];
                idx += 1;
            }
            start += chunk.byteLength;
            remain -= chunk.byteLength
            await writer.write(chunk);
        }
    }
    writer.close();
}