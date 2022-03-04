import * as crypo from "./src/crypo"
import path from "path-browserify"
import streamSaver from 'streamsaver'
import * as j2j from './src/webj2j'
import * as help from './src/help'

let fileIsHere = false
let working = false

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getOS() {
    let userAgent = window.navigator.userAgent.toLowerCase(),
        macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
        windowsPlatforms = /(win32|win64|windows|wince)/i,
        iosPlatforms = /(iphone|ipad|ipod)/i,
        os = null;

    if (macosPlatforms.test(userAgent)) {
        os = "macos";
    } else if (iosPlatforms.test(userAgent)) {
        os = "ios";
    } else if (windowsPlatforms.test(userAgent)) {
        os = "windows";
    } else if (/android/.test(userAgent)) {
        os = "android";
    } else if (!os && /linux/.test(userAgent)) {
        os = "linux";
    }

    return os;
}

function setprogbar(params:number) {
    try {
        const progbar = document.querySelector('progress')
        if (progbar !== null){
            progbar.value = params
        }   
    } catch (error) {
        console.log(error)
    }
}

function checkRequirementVaild() {
    function Invaild(message:string = '권장사양을 충족하지 않는 기기입니다.') {
        const infoDom = document.getElementById('info') 
        if(infoDom !== null){
            infoDom.innerText = message
        }
    }
    const root = document.querySelector<HTMLElement>(':root')
    if(root){
        if(window.screen.width < window.screen.height){
            console.log('big')
            root.style.setProperty('--main-width', '90vw');
            const liArray: HTMLElement[] = Array.prototype.slice.call(document.querySelectorAll(".ele"));
            const topMar = document.getElementById('topmar')
            for (const i in liArray){
                liArray[i].style.fontSize = '40px'
                liArray[i].style.height = '10vh'
            }
            if(topMar){
                topMar.style.marginTop = '10vh'
                console.log('bigger')

            }
        }
        else{
            console.log('smol')
            root.style.setProperty('--main-width', '40vw');
        }
    }
    else{
        console.log('smol')
    }
}
checkRequirementVaild()

async function main(){
    const fileInputDom = <HTMLInputElement>document.getElementById('file')
    const passwordDom = <HTMLInputElement>document.getElementById('password')
    const encryptButton = document.getElementById('en')
    const decryptButton = document.getElementById('de')
    const fileLabel = document.getElementById('fileLabel')
    const winLink = document.getElementById('win')
    const helpBtn = document.getElementById('help')
    const helpDecs = document.getElementById('h')
    const extname = '.ashs'
    document.title = extname.toUpperCase()

    if(!((fileInputDom !== null && passwordDom !== null && encryptButton !== null && decryptButton !== null
        && fileLabel !== null&& winLink !== null && helpBtn !== null && helpDecs !== null))){
        await sleep(10)
        main()
        return
    }
    if(getOS() === 'windows'){
        winLink.style.visibility = 'visible'
        winLink.setAttribute('href', `https://github.com/gramedcart/ASHS/wiki/ASHS-windows`)
        winLink.innerText = ''
    }

    helpBtn.onclick = () => {
        helpDecs.innerHTML = help.getinfo()
        helpDecs.style.height = '100vh'
        helpDecs.style.visibility = 'visible'
    }

    helpDecs.onclick = () => {
        helpDecs.style.height = '0vh'
        helpDecs.style.visibility = 'hidden'
    }
    fileInputDom.onchange = () => {
        if(fileInputDom.files === null){
            return
        }
        if(fileInputDom.files.length < 0){
            return
        }
        if(fileInputDom.files.length > 1){
            fileLabel.innerText = `${fileInputDom.files[0].name} 포함 총 ${fileInputDom.files.length}개의 파일`
        }
        else{
            fileLabel.innerText = fileInputDom.files[0].name
        }
        fileIsHere = true
    }
    async function Crypt(isEncrypt:boolean = true) {
        if(working){
            alert('다른 작업이 실행중입니다.')
            return
        }
        if(fileIsHere === false || fileInputDom.files === null){
            alert('파일이 존재하지 않습니다!')
            return
        }
        working = true
        const password = passwordDom.value
        let chunks = -1
        const divv = document.getElementById('cas')
        if(divv !== null){
            divv.innerHTML = ''
        }
        function parseFile(file: File, filename:string) {
            return new Promise<void>(async (callback)=>{
                let writer:WritableStreamDefaultWriter<any>|FileSystemWritableFileStream
                if(!window.showSaveFilePicker){
                    const fileStream = streamSaver.createWriteStream(filename)
                    writer = fileStream.getWriter()
                }
                else{
                    if(isEncrypt){
                        const fs = await window.showSaveFilePicker({
                            suggestedName: filename,
                            types: [{
                                description: 'ASHS File',
                                accept: {
                                  'application/octet-stream': ['.ashs'],
                                },
                            }],
                        });
                        writer = await fs.createWritable();
                    }
                    else{
                        const fs = await window.showSaveFilePicker({
                            suggestedName: filename,
                        });
                        writer = await fs.createWritable();
                    }
                }
                if(fileIsHere === false || fileInputDom.files === null){
                    return
                }
                let chunk = 10240000;
                if(!isEncrypt){
                    chunk += 43
                }
                let offset = 0;
                let fr = new FileReader();
                fr.onload = async function() {
                    try {
                        if(typeof(fr.result) === 'string' || fr.result === null){
                            return
                        }
                        let temp:Uint8Array
                        if(isEncrypt){
                            temp = crypo.Encrypt(new Uint8Array(fr.result), password)
                        }
                        else{
                            temp = crypo.Decrypt(new Uint8Array(fr.result), password)
                        }
                        console.log('Dumping')
                        offset += chunk;
                        writer.write(temp)
    
                        continue_reading();   
                    } catch (error) {
                        console.log(error)
                        alert('오류가 발생했습니다')
                        working = false
                    }
                };
                fr.onerror = function() {
                    callback();
                };

                async function startReading() {
                    continue_reading()
                }
                startReading()

                async function continue_reading() {
                    try {
                        if (offset >= file.size) {
                            setprogbar(1)
                            writer.close()
                            callback();
                            if(divv !== null){
                                divv.innerHTML =`${filename} 파일이 저장되었습니다`;
                            }
                            return;
                        }
                        let slice = file.slice(offset, offset + chunk);
                        chunks += 1
                        setprogbar(offset/file.size)
                        console.log(`${offset} / ${file.size} | ${chunks} | ${offset/file.size*100}%`)
                        fr.readAsArrayBuffer(slice);   
                    } catch (error) {
                        console.log(error)
                        alert('파일을 합치는 데 오류가 발생했습니다')
                        working = false
                    }
                }
            })
        }
        for(let i=0;i<fileInputDom.files.length;i++){
            const fname = fileInputDom.files[i].name
            const isJ2J = path.parse(fname).ext.toLowerCase() == '.j2j'
            if(fileInputDom.files[i] === undefined){
                window.alert('파일을 읽는데 실패하였습니다. 새로고침 후 다시 시도해 주세요')
                continue
            }
            if(isEncrypt && path.parse(fname).ext === extname){
                if(!window.confirm('암호화하려는 파일이 이미 암호화 되어있습니다.\n정말 암호화하시겠습니까?')){
                    continue
                }
            }
            if((!isEncrypt) && path.parse(fname).ext !== extname && (!isJ2J)){
                window.alert('복호화하려는 파일의 확장자가 올바르지 않습니다.')
                continue
            }
            let fName
            if(isEncrypt){
                fName = `${fname}${extname}`
            }
            else{
                fName = `${path.parse(fname).name}`
            }
            console.log(path.parse(fname).ext.toLowerCase() )
            if(isJ2J && !isEncrypt){
                console.log('decrypt j2j')
                fName = `${path.parse(fname).name}`
                await j2j.decrypt(fileInputDom.files[i], password, fName)
            }
            else{
                await parseFile(fileInputDom.files[i], fName)
            }
            console.log('downloading..')
        }
        console.log('complete')
        working = false
    }
    encryptButton.onclick = () => {Crypt(true)}
    decryptButton.onclick = () => {Crypt(false)}

}

function isASCII(str:string) {
    return /^[\x00-\x7F]*$/.test(str);
}

main()
