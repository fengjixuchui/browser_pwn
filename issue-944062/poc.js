function includes(key, array) {
  // Transition to dictionary mode in the final invocation.
  array.__defineSetter__(key, () => {});
  // Will then read OOB.
  return array.includes(1234);
}
includes("", []);
includes("", []);
%OptimizeFunctionOnNextCall(includes);
includes("", []);
includes("1235", []);