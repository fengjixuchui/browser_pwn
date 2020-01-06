// object_to_number.js
len = {
    toString: function()
    {
        array.length = 0x100;

        return 0x1000;
    }
}

tmp=[]
array = [3];
tmp.length=len;
console.log("array length changed to "+array.length);
