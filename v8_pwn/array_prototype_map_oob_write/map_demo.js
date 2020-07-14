/*************************************************************
 * File Name: map_demo.js
 * 
 * Created on: 2019-12-17 01:57:40
 * Author: raycp
 * 
 * Last Modified: 2019-12-17 02:17:21
 * Description: array.prototype.map demo
************************************************************/
var a = [];

a[2] = 3;

a[4] = 6;

let b = a.map(function(x) { return 10000;  });

for(let i = 0; i<b.length; i++) {
    console.log(b[i]);
}
%DebugPrint(a);
%DebugPrint(b);
%SystemBreak();
