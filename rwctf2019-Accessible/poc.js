/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-05-07 06:25:04
 * Author: raycp
 * 
 * Last Modified: 2020-05-10 16:41:17
 * Description: 
************************************************************/

function f(obj)
{
    return obj.x.a;
}

var o = {};
o.x = {a: 1.1};
//%DebugPrint(o);
%PrepareFunctionForOptimization(f);
f(o);
f(o);
%OptimizeFunctionOnNextCall(f);
f(o);
o.x = {b: {}};
//%DebugPrint(o);
console.log(f(o));
