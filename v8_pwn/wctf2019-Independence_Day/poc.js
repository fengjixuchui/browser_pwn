function foo(idx)
{
    return o[idx];
}

// mark o.map stable
var o = [1.1, 2.2];
o.x = 2.2;
foo(0);
foo(0);
%OptimizeFunctionOnNextCall(foo);
foo(0);
o[2000] = 2.2;
print(foo(2));

