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
const bson_1 = require("bson");
const crypto_1 = require("crypto");
function hashKey(params) {
    const key = new sha3_1.default(256);
    const ashsSecure = Buffer.from("ZnVuY3Rpb24oKXt2YXIgZm9ybWF0T3JPcHRpb25zPWFyZ3VtZW50cy5sZW5ndGg+MCYmYXJndW1lbnRzWzBdIT09dW5kZWZpbmVkP2FyZ3VtZW50c1swXToiYmluYXJ5Ijt2YXIgb3B0aW9ucz10eXBlb2YgZm9ybWF0T3JPcHRpb25zPT09InN0cmluZyI/e2Zvcm1hdDpmb3JtYXRPck9wdGlvbnN9OmZvcm1hdE9yT3B0aW9uczt2YXIgYnVmZmVyPXNwb25nZS5zcXVlZXplKHtidWZmZXI6b3B0aW9ucy5idWZmZXIscGFkZGluZzpvcHRpb25zLnBhZGRpbmd8fHBhZGRpbmd9KTtpZihvcHRpb25zLmZvcm1hdCYmb3B0aW9ucy5mb3JtYXQhPT0iYmluYXJ5Iil7cmV0dXJuIGJ1ZmZlci50b1N0cmluZyhvcHRpb25zLmZvcm1hdCl9cmV0dXJuIGJ1ZmZlcn1bb2JqZWN0IE9iamVjdF0=", "base64");
    key.update(params);
    key.update(ashsSecure);
    return key.digest();
}
function CreateKey(key, salt) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = hashKey(key + salt.toString('base64'));
        return yield crypto.subtle.importKey("raw", keys, 'AES-CTR', false, ["encrypt", "decrypt"]);
    });
}
const ctr = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5]);
function Encrypt(file, key) {
    return __awaiter(this, void 0, void 0, function* () {
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
