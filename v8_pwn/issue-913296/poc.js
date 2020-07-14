/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-03-17 05:45:14
 * Author: raycp
 * 
 * Last Modified: 2020-03-19 07:36:29
 * Description: poc fo issue 913296
************************************************************/
function foo(trigger) {
    return Object.is((trigger ? -0 : 0) - 0, -0);
}

print(foo(false));
%OptimizeFunctionOnNextCall(foo);
print(foo(true));
