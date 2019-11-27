/*************************************************************
 * File Name: dataview.js
 * 
 * Created on: 2019-11-26 06:34:28
 * Author: raycp
 * 
 * Last Modified: 2019-11-26 06:34:39
 * Description: demo for dataview
************************************************************/
var buffer = new ArrayBuffer(16);
var view = new DataView(buffer);

view.setUint32(0, 0x44434241, true);
console.log(view.getUint8(0, true));
%DebugPrint(buffer);
%DebugPrint(view);
%SystemBreak();

