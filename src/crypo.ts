import SHA3 from "sha3";
import {serialize, deserialize} from "bson";
import {randomBytes} from "crypto"

function hashKey(params:string): Buffer {
    const key = new SHA3(256)
    const ashsSecure = Buffer.from("ZnVuY3Rpb24oKXt2YXIgZm9ybWF0T3JPcHRpb25zPWFyZ3VtZW50cy5sZW5ndGg+MCYmYXJndW1lbnRzWzBdIT09dW5kZWZpbmVkP2FyZ3VtZW50c1swXToiYmluYXJ5Ijt2YXIgb3B0aW9ucz10eXBlb2YgZm9ybWF0T3JPcHRpb25zPT09InN0cmluZyI/e2Zvcm1hdDpmb3JtYXRPck9wdGlvbnN9OmZvcm1hdE9yT3B0aW9uczt2YXIgYnVmZmVyPXNwb25nZS5zcXVlZXplKHtidWZmZXI6b3B0aW9ucy5idWZmZXIscGFkZGluZzpvcHRpb25zLnBhZGRpbmd8fHBhZGRpbmd9KTtpZihvcHRpb25zLmZvcm1hdCYmb3B0aW9ucy5mb3JtYXQhPT0iYmluYXJ5Iil7cmV0dXJuIGJ1ZmZlci50b1N0cmluZyhvcHRpb25zLmZvcm1hdCl9cmV0dXJuIGJ1ZmZlcn1bb2JqZWN0IE9iamVjdF0=", "base64") 
    key.update(params)
    key.update(ashsSecure)
    return key.digest()
}

async function CreateKey(key:string, salt:Buffer): Promise<CryptoKey>{
    const keys = hashKey(key + salt.toString('base64'))
    return await crypto.subtle.importKey("raw", keys, 'AES-CTR', false,["encrypt", "decrypt"]);
}

const ctr = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5])

export async function Encrypt(file:Uint8Array, key:string) {
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