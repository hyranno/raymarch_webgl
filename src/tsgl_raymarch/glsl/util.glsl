
float coef_isEqual(float a, float b){ return 1.0 - abs(sign(a-b)); }
float coef_isEqual(int a, int b){ return coef_isEqual(float(a), float(b)); }
float coef_notEqual(float a, float b){ return abs(sign(a-b)); }
float coef_notEqual(int a, int b){ return coef_notEqual(float(a), float(b)); }
float coef_isGreater(float a, float b){ return max(sign(a-b), 0.0); }
float coef_isGreater(int a, int b){ return coef_isGreater(float(a), float(b)); }
float coef_isLesser(float a, float b){ return max(sign(b-a), 0.0); }
float coef_isLesser(int a, int b){ return coef_isLesser(float(a), float(b)); }

vec4 quaternion_fromDCM(mat3 dcm) {
  float w  = sqrt((+dcm[0][0] +dcm[1][1] +dcm[2][2] + 1.0)/4.0);
  float tx = sqrt((+dcm[0][0] -dcm[1][1] -dcm[2][2] + 1.0)/4.0);
  float ty = sqrt((-dcm[0][0] +dcm[1][1] -dcm[2][2] + 1.0)/4.0);
  float tz = sqrt((-dcm[0][0] -dcm[1][1] +dcm[2][2] + 1.0)/4.0);
  float x = tx * sign(dcm[1][2] - dcm[2][1]);
  float y = ty * sign(dcm[2][0] - dcm[0][2]);
  float z = tz * sign(dcm[0][1] - dcm[1][0]);
  return vec4(x, y, z, w);
}
vec4 quaternion_fromAngleAxis(float angle, vec3 axis) {
  float x = axis.x*sin(angle/2.0);
  float y = axis.y*sin(angle/2.0);
  float z = axis.z*sin(angle/2.0);
  float w = cos(angle/2.0);
  return normalize(vec4(x,y,z,w));
}
vec4 quaternion_inverse(vec4 q) {
  return vec4(-q.xyz, q.w);
}
vec4 quaternion_mul(vec4 q0, vec4 q1) {
  return vec4(cross(q0.xyz, q1.xyz) + q0.w*q1.xyz + q1.w*q0.xyz, q0.w*q1.w - dot(q0.xyz, q1.xyz));
}
vec3 quaternion_rot3(vec4 q, vec3 v) {
  return quaternion_mul( quaternion_mul(q, vec4(v,0.0)), quaternion_inverse(q)).xyz;
}

mat3 dcm_fromXY(vec3 x, vec3 y) {
  vec3 z = cross(x,y);
  mat3 m = mat3(normalize(x),normalize(y),normalize(z));
  return m / determinant(m);
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
${(new Array(5)).map((_, dataLen) => `
  uint hash32(uint data[${dataLen$}]) {
    uint seed = 0x655e774fu;
    for (int i=0; i<data.length(); i++) {
      seed = hash32(data[i], seed);
    }
    return seed;
  }
`).join("")}


float smoothmin(float v1, float v2, float smoothness) {
  float h = 0.5 + 0.5*clamp((v2-v1)/smoothness, -1.0, 1.0);
  float d = smoothness*h*(1.0-h); // > mix(v2,v1,h)-min(v2,v1)
  return mix(v2,v1,h) - d;
}
float smoothmax(float v1, float v2, float smoothness) {
  float h = 0.5 - 0.5*clamp((v2-v1)/smoothness, -1.0, 1.0);
  float d = smoothness*h*(1.0-h); // > mix(v2,v1,h)-min(v2,v1)
  return mix(v2,v1,h) + d;
}
