function foo(idx) {

    let o = [, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9];

    let x = -Infinity;
    let i = 0;
    for (; i < 1; i += x) {
    if (i == -Infinity) x = +Infinity;
    }

    let value = Math.max(i, 1);
  	// compiler: Range(1, inf)
  	// reality: NaN
    value = -value;
  	// compiler: Range(-inf, -1)
  	// reality: NaN
    value = Math.max(value, -2);
  	// compiler: Range(-2, -1)
  	// reality: NaN
    value >>= 0;
		// compiler: Range(-2, -1)
  	// reality: 0
    value += 2;
  	// compiler: Range(0, 1)
  	// reality: 2
    idx &= 0x7;
  	// compiler: Range(0, 7)
  	// reality: Range(0, 7)
    idx = idx *value;
  	// compiler: Range(0, 7)
  	// reality: Range(0, 14)
    idx<<=1;
  	// compiler: Range(0, 14)
  	// reality: Range(0, 28)
    idx>>=1;
  	// compiler: Range(0, 7)
  	// reality: Range(0, 14)
    return o[idx];

}
%PrepareFunctionForOptimization(foo);
print(foo(5));
print(foo(5));
print(foo(2));
print(foo(2));
%OptimizeFunctionOnNextCall(foo);
print(foo(5));
