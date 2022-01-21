import SHA3 from "sha3";
import { ModeOfOperation, Counter } from "aes-js";
import {serialize, deserialize} from "bson";
import {randomBytes} from "crypto"

function hashKey(params:string): Buffer {
    const key = new SHA3(256)
    key.update(params)
    key.update(key.digest.toString() + key)
    return Buffer.from(key.digest())
}

export function Encrypt(file:Uint8Array, key:string): Uint8Array{
    const salt = randomBytes(16)
    const keys = hashKey(key + salt.toString('base64'))
    const aesCtr = new ModeOfOperation.ctr(keys, new Counter(5));
    const returnFile = aesCtr.encrypt(file)
    return serialize({data: returnFile, salt:salt})
}

export function Decrypt(file:Uint8Array, key:string): Uint8Array{
    const f = deserialize(file)
    if(f.data === null || f.salt === null){
        throw 'data is null'
    }
    const MainFile:Buffer = f.data.buffer
    const salt:Buffer = f.salt.buffer
    const keys = hashKey(key + salt.toString('base64'))
    const aesCtr = new ModeOfOperation.ctr(keys, new Counter(5));
    const returnFile = aesCtr.decrypt(MainFile)
    return returnFile
}