# browser_pwn
browser pwn, main work now.

* browser_pwn_basic_knowledge

    description: some basic knowledge and scripts of browser pwn.

    related link: None

    finished date: 2019

* starctf2019-oob

    description: d8 basic pwn game, with oob vuln.

    writeup: None

    related link: None

* 数字经济-final-browser

    description: callback of Object::ToNumber to form uaf and oob write.

    writeup: None

    related link: None

    finished date: 2019

* plaidctf2018-roll_a_d8

    description: oob vuln in array.form

    writeup: None

    related link: [chromium commit](https://chromium.googlesource.com/v8/v8.git/+/b5da57a06de8791693c248b7aafc734861a3785d)

    finished date: 2019

* array_prototype_map_oob_write

    description: a oob write vuln in array.prototype.map function, with abusing use of Symbol.species

    writeup: None

    official link: [chromium commit](https://chromium.googlesource.com/v8/v8.git/+/192984ea88badc0c02e22e528b1243a9efa46f90)

    finished date: 2019

* cve-2018-17463

    description: ObjectCreate's side effect annotation

    writeup: None

    official link: [chromium commit](https://chromium.googlesource.com/v8/v8.git/+/52a9e67a477bdb67ca893c25c145ef5191976220)

    finished date: 2020

* 34c3ctf-v9

    description: exp for v9 in 34c3ctf, bug in redundancy-elimination

    writeup: None

    official link: [v9](https://github.com/saelo/v9)

    finished date: 2020

* 35c3ctf-krautflare

    description: exp for krautflare in 34c3ctf, bug in type optimization

    writeup: None

    official link: [Issue 1710: Chrome: V8: incorrect type information on Math.expm1](https://bugs.chromium.org/p/project-zero/issues/detail?id=1710)

    finished date: 2020

* google-ctf2018-final-just-in-time

    description: exp for just in time game in google ctf 2018 final, bug in type optimization, with the characteristic of Number.MAX_SAFE_INTEGER.

    writeup: None

    official link: [pwn-just-in-time](https://github.com/google/google-ctf/tree/master/2018/finals/pwn-just-in-time)

    finished date: 2020

* qwb2019-final-groupupjs

    description: exp for qwb 2019 final groupupjs, oob bug in kUint32LessThan.

    writeup: None

    official link: None

    finished date: 2020

* cve-2016-5168

    description: invalidate stable map assumption for globals on creankshaft, exploit with `null String` object

    writeup: None

    official link: [Fix](https://chromium.googlesource.com/v8/v8/+/2bd7464ec1efc9eb24a38f7400119a5f2257f6e6)

    finished date: 2020

* cve-2017-5070

    description: invalid side effection judge for global value.

    writeup: None

    official link: [issue](https://bugs.chromium.org/p/chromium/issues/detail?id=722756)

    finished date: 2020

* cve-2020-6418

    description: JSCreate can have side effects, bug in receiver maps inference.

    writeup: [browser-pwn cve-2020-6418漏洞分析](https://ray-cp.github.io/archivers/browser-pwn-cve-2020-6418%E6%BC%8F%E6%B4%9E%E5%88%86%E6%9E%90)

    official link: [commit](https://chromium.googlesource.com/v8/v8/+/fb0a60e15695466621cf65932f9152935d859447)

    finished date: 2020

* Issue 762874

    description: The Typer put the wrong type on String.indexOf and String.lastIndexOf builtins, with an off by one on the upper bound. exploit it on version 6.3 and 7.4

    writeup: None

    official link: [commit-762874](https://chromium.googlesource.com/v8/v8.git/+/b8f144ec4fd1cd808f0d883668f355498b56d7fa)
    
    [commit-7bb6dc0e06fa158df508bc8997f0fce4e33512a5](https://chromium.googlesource.com/v8/v8.git/+/7bb6dc0e06fa158df508bc8997f0fce4e33512a5)


    finished date: 2020

* Issue 913296

    description: wrong typing of SpeculativeSafeIntegerSubtract, just a poc, failed to build exploit.

    writeup: None

    official link: [commit-913296](https://chromium.googlesource.com/v8/v8/+/413c2e787197063abd8435d9692355eb8693ad39)

    finished date: 2020

* cve-2019-5782

    description: wrong typing of ArgumentsLength, easy to exploit.

    writeup: None

    official link: [commit-8e4588915ba7a9d9d744075781cea114d49f0c7b](https://chromium.googlesource.com/v8/v8/+/8e4588915ba7a9d9d744075781cea114d49f0c7b)

    finished date: 2020

