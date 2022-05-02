
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


float blend(float v1, float v2, bool isMin, float smoothness, float weight) {
  float s = mix(1.0, -1.0, isMin);
  float h = 0.5 - s*0.5*clamp((v2-v1) / smoothness, -1.0, 1.0);
  h = pow(h, 1.0/weight);
  float d = smoothness*h*(1.0-h); // > mix(v2,v1,h)-min(v2,v1)
  return mix(v2,v1,h) + s*d;
}

float smoothmin(float v1, float v2, float smoothness) {
  return blend(v1,v2, true, smoothness,1.0);
}
float smoothmax(float v1, float v2, float smoothness) {
  return blend(v1,v2, false,smoothness,1.0);
}
float smoothclamp(float v, float bottom, float top, float smoothness) {
  return smoothmax(smoothmin(v, top, smoothness), bottom, smoothness);
}
