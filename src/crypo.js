"use strict";
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
function Encrypt(file, key) {
    const salt = (0, crypto_1.randomBytes)(16);
    const keys = hashKey(key + salt.toString('base64'));
    const aesCtr = new aes_js_1.ModeOfOperation.ctr(keys, new aes_js_1.Counter(5));
    const returnFile = aesCtr.encrypt(file);
    return (0, bson_1.serialize)({ data: returnFile, salt: salt });
}
exports.Encrypt = Encrypt;
function Decrypt(file, key) {
    const f = (0, bson_1.deserialize)(file);
    if (f.data === null || f.salt === null) {
        throw 'data is null';
    }
    const MainFile = f.data.buffer;
    const salt = f.salt.buffer;
    const keys = hashKey(key + salt.toString('base64'));
    const aesCtr = new aes_js_1.ModeOfOperation.ctr(keys, new aes_js_1.Counter(5));
    const returnFile = aesCtr.decrypt(MainFile);
    return returnFile;
}
exports.Decrypt = Decrypt;
