import SHA3 from "sha3";
import { ModeOfOperation, Counter } from "aes-js";
import {serialize, deserialize} from "bson";
import {randomBytes} from "crypto"

function hashKey(params:string): Buffer {
    const key = new SHA3(256)
    key.update(params)
    key.update(key.digest.toString() + key)
    return key.digest()
}

async function CreateKey(key:string, salt:Buffer): Promise<CryptoKey>{
    const keys = hashKey(key + salt.toString('base64'))
    return await crypto.subtle.importKey("raw", keys, 'AES-CTR', false,["encrypt", "decrypt"]);
}

const ctr = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5])

function EncryptOld(file:Uint8Array, key:string){
    const salt = randomBytes(16)
    const keys = hashKey(key + salt.toString('base64'))
    const aesCtr = new ModeOfOperation.ctr(keys, new Counter(ctr));
    const returnFile = aesCtr.encrypt(file)
    const d = serialize({data: returnFile, salt:salt})
    console.log(d.length)
    return d
}

export async function Encrypt(file:Uint8Array, key:string) {
    if(!window.crypto || !window.crypto.subtle){
        return EncryptOld(file, key)
    }
    const salt = randomBytes(16)
    const keycrypto = await CreateKey(key, salt)
    const returnFilex = await window.crypto.subtle.encrypt(
        {
            name: "AES-CTR",
            counter: ctr,
            length: 64
        },
        keycrypto,
        file
    )
    const returnFile = new Uint8Array(returnFilex)
    const d = serialize({data: returnFile, salt:salt})
    console.log(d.length)
    return d
}


export async function Decrypt(file:Uint8Array, key:string){
    if(!window.crypto || !window.crypto.subtle){
        return DecryptOld(file, key)
    }
    const f = deserialize(file)
    if(f.data === null || f.salt === null){
        throw 'data is null'
    }
    const salt:Buffer = f.salt.buffer
    const keycrypto = await CreateKey(key, salt)
    return new Uint8Array(await window.crypto.subtle.decrypt({
            name: "AES-CTR",
            counter: ctr,
            length: 64
        },
        keycrypto,
        f.data.buffer
    ))
}

function DecryptOld(file:Uint8Array, key:string): Uint8Array{
    const f = deserialize(file)
    if(f.data === null || f.salt === null){
        throw 'data is null'
    }
    const MainFile:Buffer = f.data.buffer
    const salt:Buffer = f.salt.buffer
    const keys = hashKey(key + salt.toString('base64'))
    const aesCtr = new ModeOfOperation.ctr(keys, new Counter(ctr));
    const returnFile = aesCtr.decrypt(MainFile)
    return returnFile
}