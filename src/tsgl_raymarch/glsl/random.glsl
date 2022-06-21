float uint16ToFloat01(uint v) {
  return float(v) / (pow(2.0,16.0)-1.0);
}

uint rotr16(uint x, uint shift) {
  return x >> shift | (x & (1u<<shift)-1u) << (16u-shift);
}

uint PCG16_mult = 0xf156da97u;
uint PCG16_incr = 0x7f94a2d3u;
void PCG16_init(uint seed, out uint state) {
  state = seed + PCG16_incr;
  PCG16_rand(state);
}
uint PCG16_rand(inout uint state) { //PCG-XSH-RR
  uint bits_in = 32u;
  uint bits_out = bits_in/2u;
  uint m = uint(log2(float(bits_in))) - 1u;
  uint x = state;
  uint count = x >> (bits_in-m);
  state = (x * PCG16_mult + PCG16_incr) & 0xffffffffu;
  x ^= x >> (bits_in-(bits_out-m))/2u;
  return rotr16(x >> bits_out-m, count);
}

uint hash32(uint data, uint seed) {
  uint mult = 0x8f5eu;
  uint state;
  PCG16_init(seed + data, state);
  return PCG16_rand(state) * mult;
}
${(new Array(5).fill(0)).map((_, maxIndex) => `
  uint hash32(uint data[${maxIndex+1}]) {
    uint seed = 0x655e774fu;
    for (int i=0; i<data.length(); i++) {
      seed = hash32(data[i], seed);
    }
    return seed;
  }
`).join("")}
/*
${[2,3,4].map((i) => `
  uint hash32(vec${i} data) {
    uvec${i} v = floatBitsToUint(data);
    return hash32(uint[]( ${(new Array(i)).map((_, j) => `v[${j}]`).join(",")} ));
  }
`).join("")}
*/
uint hash32(vec2 data) {
  uvec2 v = floatBitsToUint(data);
  return hash32(uint[](v[0], v[1]));
}
uint hash32(vec3 data) {
  uvec3 v = floatBitsToUint(data);
  return hash32(uint[](v[0], v[1], v[2]));
}
uint hash32(vec4 data) {
  uvec4 v = floatBitsToUint(data);
  return hash32(uint[](v[0], v[1], v[2], v[3]));
}

float rand_uniform (inout uint state) {
  return uint16ToFloat01( PCG16_rand(state) );
}
float rand_normal (inout uint state) { // Box-Muller's Method
  float x = rand_uniform(state);
  float y = rand_uniform(state);
  float xv = select(x, 0.5, x==0.0);
  float yv = select(y, 0.5, y==0.0);
  float r = sqrt(-2.0*log(xv));
  return r*cos(radians(360.0)*y); //and r*sin(radians(360.0)*y)
}
float rand_exponential (inout uint state) { // inversion method
  return -log(1.0-rand_uniform(state));
}
