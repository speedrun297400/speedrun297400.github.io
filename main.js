"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const crypo = __importStar(require("./src/crypo"));
const localforage_1 = __importDefault(require("localforage"));
const path_browserify_1 = __importDefault(require("path-browserify"));
let fileIsHere = false;
let fname = '';
let working = false;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const downloadBlob = (data, fileName, mimeType = 'application/octet-stream') => {
    const downloadURL = (data, fileName) => {
        const a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style.display = 'none';
        a.click();
        a.remove();
    };
    const blob = new Blob(data, {
        type: mimeType
    });
    const url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
function setprogbar(params) {
    const progbar = document.querySelector('progress');
    if (progbar !== null) {
        progbar.value = params;
    }
}
function checkRequirementVaild() {
    function Invaild() {
        const infoDom = document.getElementById('info');
        if (infoDom !== null) {
            infoDom.innerText = '권장사양을 충족하지 않는 기기입니다.';
        }
    }
    if (((!localforage_1.default.supports(localforage_1.default.WEBSQL)) && (!localforage_1.default.supports(localforage_1.default.INDEXEDDB)))) {
        Invaild();
    }
    if (navigator.deviceMemory && (navigator.deviceMemory <= 2)) {
        Invaild();
    }
    const root = document.querySelector(':root');
    if (root) {
        if (window.screen.width < window.screen.height) {
            root.style.setProperty('--main-width', '70vw');
        }
        else {
            root.style.setProperty('--main-width', '40vw');
        }
    }
}
checkRequirementVaild();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileInputDom = document.getElementById('file');
        const passwordDom = document.getElementById('password');
        const encryptButton = document.getElementById('en');
        const decryptButton = document.getElementById('de');
        const fileLabel = document.getElementById('fileLabel');
        const extname = '.ashs';
        document.title = extname;
        yield localforage_1.default.clear();
        window.onerror = function (message) {
            alert(`오류가 발생했습니다: ${message}`);
        };
        if (!((fileInputDom !== null && passwordDom !== null && encryptButton !== null && decryptButton !== null && fileLabel !== null))) {
            yield sleep(10);
            main();
            return;
        }
        fileInputDom.onchange = () => {
            if (fileInputDom.files === null) {
                return;
            }
            if (fileInputDom.files.length < 0) {
                return;
            }
            fname = fileInputDom.files[0].name;
            fileLabel.innerText = fname;
            fileIsHere = true;
        };
        function Crypt(isEncrypt = true) {
            return __awaiter(this, void 0, void 0, function* () {
                if (working) {
                    alert('다른 작업이 실행중입니다.');
                    return;
                }
                if (fileIsHere === false || fileInputDom.files === null) {
                    alert('파일이 존재하지 않습니다!');
                    return;
                }
                working = true;
                const password = passwordDom.value;
                let chunks = -1;
                let chunkList = [];
                function parseFile() {
                    return new Promise((callback) => {
                        if (fileIsHere === false || fileInputDom.files === null) {
                            return;
                        }
                        const file = fileInputDom.files[0];
                        let chunk = 10240000;
                        if (!isEncrypt) {
                            chunk += 43;
                        }
                        let offset = 0;
                        let fr = new FileReader();
                        fr.onload = function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                try {
                                    if (typeof (fr.result) === 'string' || fr.result === null) {
                                        return;
                                    }
                                    let temp;
                                    if (isEncrypt) {
                                        temp = crypo.Encrypt(new Uint8Array(fr.result), password);
                                    }
                                    else {
                                        temp = crypo.Decrypt(new Uint8Array(fr.result), password);
                                    }
                                    yield localforage_1.default.setItem(`filedata${chunks}`, temp);
                                    offset += chunk;
                                    temp = new Uint8Array();
                                    continue_reading();
                                }
                                catch (error) {
                                    console.error(error);
                                    localforage_1.default.clear();
                                    alert('오류가 발생했습니다');
                                    working = false;
                                }
                            });
                        };
                        fr.onerror = function () {
                            callback([]);
                        };
                        function startReading() {
                            return __awaiter(this, void 0, void 0, function* () {
                                continue_reading();
                            });
                        }
                        startReading();
                        function continue_reading() {
                            var _a;
                            return __awaiter(this, void 0, void 0, function* () {
                                if (offset >= file.size) {
                                    for (let i = 0; i < chunks + 1; i++) {
                                        console.log(i);
                                        let got = (_a = (yield localforage_1.default.getItem(`filedata${i}`))) !== null && _a !== void 0 ? _a : new Uint8Array();
                                        chunkList.push(got);
                                        got = new Uint8Array();
                                    }
                                    callback(chunkList);
                                    return;
                                }
                                let slice = file.slice(offset, offset + chunk);
                                chunks += 1;
                                setprogbar(offset / file.size);
                                console.log(`${offset} / ${file.size} | ${chunks} | ${offset / file.size * 100}%`);
                                fr.readAsArrayBuffer(slice);
                            });
                        }
                    });
                }
                if (isEncrypt && path_browserify_1.default.parse(fname).ext === extname) {
                    if (!window.confirm('암호화하려는 파일이 이미 암호화 되어있습니다.\n정말 암호화하시겠습니까?')) {
                        working = false;
                        return;
                    }
                }
                if ((!isEncrypt) && path_browserify_1.default.parse(fname).ext !== extname) {
                    window.alert('복호화하려는 파일의 확장자가 올바르지 않습니다.');
                    working = false;
                    return;
                }
                const datas = yield parseFile();
                console.log('downloading..');
                if (isEncrypt) {
                    downloadBlob(datas, `${fname}${extname}`);
                }
                else {
                    downloadBlob(datas, `${path_browserify_1.default.parse(fname).name}`);
                }
                yield localforage_1.default.clear();
                working = false;
            });
        }
        encryptButton.onclick = () => { Crypt(true); };
        decryptButton.onclick = () => { Crypt(false); };
    });
}
main();