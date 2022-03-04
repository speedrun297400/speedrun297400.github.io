"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getinfo = void 0;
const info = `
ASHS: Another Safe Hidden Secure file
웹버전

설명:
    ASHS 파일을 암호화/복호화 할 수 있는 웹앱입니다.
    j2j 파일 복호화도 지원합니다.

암호화 방법:
    1. "파일 선택" 을 클릭하여 암호화 할 파일을 선택한다.
    2. 비밀번호를 입력한다 (선택사항)
    3. 암호화 버튼을 누른다.

복호화 방법:
    1. "파일 선택" 을 클릭하여 복호화 할 파일을 선택한다.
    2. 비밀번호를 입력한다.
    3. 복호화 버튼을 누른다.

ASHS란:
    파일을 암호화하기 만든 포맷입니다.
    AES와 SHA3-256을 사용하여 느리지만, 매우 강력합니다.
    Salt를 사용하여 같은 비밀번호로 같은 파일을 암호화해도 전혀 다른 파일이 나옵니다.

오픈 소스:
    StreamSaver:
        https://github.com/jimmywarting/StreamSaver.js/blob/master/LICENSE
    
    Milligram:
        https://github.com/milligram/milligram/blob/master/license

    aes-js:
        https://github.com/ricmoo/aes-js/blob/master/LICENSE.txt

    js-bson:
        https://github.com/mongodb/js-bson/blob/main/LICENSE.md

    js-sha3:
        https://github.com/emn178/js-sha3/blob/master/LICENSE.txt
    
    node-sha3:
        https://github.com/phusion/node-sha3/blob/main/LICENSE
    
    WebJ2J:
        https://github.com/blluv/WebJ2J/blob/main/LICENSE




`;
function getinfo() {
    const newStr = info.replace(/(<a href=")?((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)))(">(.*)<\/a>)?/gi, function () {
        return '<a href="' + arguments[2] + '">' + (arguments[7] || arguments[2]) + '</a>';
    }).replaceAll('\n', '<br>').replaceAll('  ', '　');
    return newStr;
}
exports.getinfo = getinfo;
