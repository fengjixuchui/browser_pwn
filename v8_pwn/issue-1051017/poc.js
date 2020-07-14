function foo() {
    var x = -Infinity;
    var i = 0;
    for (; i < 1; i += x) {
        if (i == -Infinity) x = +Infinity;
    }
    return i;
}

%PrepareFunctionForOptimization(foo);
print(Object.is(foo(), NaN));
print(Object.is(foo(), NaN));
%OptimizeFunctionOnNextCall(foo);
print(Object.is(foo(), NaN));

