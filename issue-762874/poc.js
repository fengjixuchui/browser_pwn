/*************************************************************
 * File Name: exp.js
 * 
 * Created on: 2020-03-09 04:44:37
 * Author: raycp
 * 
 * Last Modified: 2020-03-09 06:11:49
 * Description: 
************************************************************/

const maxLength = %StringMaxLength();
const s = 'A'.repeat(maxLength);

function foo(s) {
  let x = s.lastIndexOf("", maxLength);
  return x === maxLength;
}

assertTrue(foo(s));
assertTrue(foo(s));
%OptimizeFunctionOnNextCall(foo);
assertTrue(foo(s));
