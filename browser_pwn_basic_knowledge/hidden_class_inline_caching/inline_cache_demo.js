/*************************************************************
 * File Name: inline_cache_demo.js
 * 
 * Created on: 2019-11-30 20:07:30
 * Author: raycp
 * 
 * Last Modified: 2019-12-01 06:07:36
 * Description: demo for inline cache 
************************************************************/
function Point(x, y) {
    this.x = x;
    this.y = y;
    return this;
}


function set_x (obj) 
{ 
    obj.x = obj.x+1;
}
function f () {

    obj = Point(1, 2);
    for (var i = 1; i < 10000000; i++) {
        set_x(obj);
    }
    return obj.x;
}

