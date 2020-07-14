/*************************************************************
 * File Name: hidden_class_demo.js
 * 
 * Created on: 2019-11-30 18:51:03
 * Author: raycp
 * 
 * Last Modified: 2019-12-01 06:07:19
 * Description: demo for hidden class 
************************************************************/
function Point(x, y) {
        this.x = x;
        this.y = y;
    
}
var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
%DebugPrint(p1);
%DebugPrint(p2);
%SystemBreak();
p2.n = 4;
%DebugPrint(p1);
%DebugPrint(p2);
%SystemBreak();
p1.m = 3.3;
p1.n = 4;
p2.m = 3;
%DebugPrint(p1);
%DebugPrint(p2);
%SystemBreak();
