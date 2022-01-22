import * as crypo from "./src/crypo"
import localForage from "localforage"
import path from "path-browserify"

let fileIsHere = false
let working = false

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const downloadBlob = (data:Uint8Array[] ,fileName:string, mimeType:string='application/octet-stream') => {
    const downloadURL = (data:string, fileName:string) => {
        console.log('downloading URL')
        const a = document.createElement('a')
        a.href = data
        a.download = fileName
        document.body.appendChild(a)
        a.style.display = 'none'
        a.click()
        a.remove()
    }
    const blob = new Blob(data, {
        type: mimeType
    })
    const url = window.URL.createObjectURL(blob)
    downloadURL(url, fileName)
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

function setprogbar(params:number) {
    try {
        const progbar = document.querySelector('progress')
        if (progbar !== null){
            progbar.value = params
        }   
    } catch (error) {
    }
}

function checkRequirementVaild() {
    function Invaild(message:string = '권장사양을 충족하지 않는 기기입니다.') {
        const infoDom = document.getElementById('info') 
        if(infoDom !== null){
            infoDom.innerText = message
        }
    }
    if(window.navigator.userAgent.toLowerCase().includes('wv')){
        Invaild('웹뷰로 사용중입니다. 브라우저로 사용하지 않으면 오류가 발생할 수 있습니다')
    }
    else if (((!localForage.supports(localForage.WEBSQL)) && (!localForage.supports(localForage.INDEXEDDB)))){
        Invaild()
    }
    else if(navigator.deviceMemory && (navigator.deviceMemory <= 2)){
        Invaild()
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
    const extname = '.ashs'
    document.title = extname.toUpperCase()
    await localForage.clear()

    if(!((fileInputDom !== null && passwordDom !== null && encryptButton !== null && decryptButton !== null && fileLabel !== null))){
        await sleep(10)
        main()
        return
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
        let chunkList:Uint8Array[] = []
        function parseFile(file: File) {
            return new Promise<Uint8Array[]>((callback)=>{
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
                        await localForage.setItem(`filedata${chunks}`, temp);
                        offset += chunk;
                        temp = new Uint8Array()
    
                        continue_reading();   
                    } catch (error) {
                        console.error(error)
                        localForage.clear()
                        alert('오류가 발생했습니다')
                        working = false
                    }
                };
                fr.onerror = function() {
                    callback([]);
                };

                async function startReading() {
                    continue_reading()
                }
                startReading()

                async function continue_reading() {
                    try {
                        if (offset >= file.size) {
                            for(let i=0;i<chunks+1;i++){
                                console.log(i)
                                let got:Uint8Array = (await localForage.getItem(`filedata${i}`)) ?? new Uint8Array()
                                chunkList.push(got)
                                got = new Uint8Array()
                                setprogbar(1 + (i/chunks))
                            }
                            callback(chunkList);
                            return;
                        }
                        let slice = file.slice(offset, offset + chunk);
                        chunks += 1
                        setprogbar(offset/file.size)
                        console.log(`${offset} / ${file.size} | ${chunks} | ${offset/file.size*100}%`)
                        fr.readAsArrayBuffer(slice);   
                    } catch (error) {
                        console.error(error)
                        localForage.clear()
                        alert('오류가 발생했습니다')
                        working = false
                    }
                }
            })
        }
        for(let i=0;i<fileInputDom.files.length;i++){
            const fname = fileInputDom.files[i].name
            if(fileInputDom.files[i] === undefined){
                window.alert('파일을 읽는데 실패하였습니다. 새로고침 후 다시 시도해 주세요')
                continue
            }
            if(isEncrypt && path.parse(fname).ext === extname){
                if(!window.confirm('암호화하려는 파일이 이미 암호화 되어있습니다.\n정말 암호화하시겠습니까?')){
                    continue
                }
            }
            if((!isEncrypt) && path.parse(fname).ext !== extname){
                window.alert('복호화하려는 파일의 확장자가 올바르지 않습니다.')
                continue
            }
    
            const datas = await parseFile(fileInputDom.files[i])
            console.log('downloading..')
            if(isEncrypt){
                downloadBlob(datas, `${fname}${extname}`)
            }
            else{
                downloadBlob(datas, `${path.parse(fname).name}`)
            }
            await localForage.clear()
        }
        console.log('complete')
        working = false
    }
    encryptButton.onclick = () => {Crypt(true)}
    decryptButton.onclick = () => {Crypt(false)}

}

main()
