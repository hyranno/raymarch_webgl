

vec4 quaternion_fromDCM(mat3 dcm) {
  vec4 res;
  vec4 a4v = vec4(
    2.0 *sqrt(+dcm[0][0] -dcm[1][1] -dcm[2][2] + 1.0),
    2.0 *sqrt(-dcm[0][0] +dcm[1][1] -dcm[2][2] + 1.0),
    2.0 *sqrt(-dcm[0][0] -dcm[1][1] +dcm[2][2] + 1.0),
    2.0 *sqrt(+dcm[0][0] +dcm[1][1] +dcm[2][2] + 1.0)
  );
  int imax = 0;
  for (int i=1; i<4; i++) {
    imax = mix(imax, i, a4v[imax] < a4v[i]);
  }
  mat4 vs = transpose(mat4(
    0.0, dcm[0][1]+dcm[1][0], dcm[2][0]+dcm[0][2], dcm[1][2]-dcm[2][1],
    dcm[0][1]+dcm[1][0], 0.0, dcm[1][2]+dcm[2][1], dcm[2][0]-dcm[0][2],
    dcm[2][0]+dcm[0][2], dcm[1][2]+dcm[2][1], 0.0, dcm[0][1]-dcm[1][0],
    dcm[1][2]-dcm[2][1], dcm[2][0]-dcm[0][2], dcm[0][1]-dcm[1][0], 0.0
  ));
  for (int i=0; i<4; i++) {
    res[i] = mix(vs[imax][i]/a4v[imax], a4v[imax]/4.0, i==imax);
  }
  return res;
}
/*
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
*/
vec4 quaternion_fromAngleAxis(float angle, vec3 axis) {
  float x = axis.x*sin(angle/2.0);
  float y = axis.y*sin(angle/2.0);
  float z = axis.z*sin(angle/2.0);
  float w = cos(angle/2.0);
  return normalize(vec4(x,y,z,w));
}
vec4 quaternion_fromSrcDest(vec3 src, vec3 dest) {
  vec3 c = cross(src, dest);
  vec3 axis = normalize(c);
  float angle = atan(length(c), dot(src, dest));
  return quaternion_fromAngleAxis( angle, axis );
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
  return mat3(normalize(x),normalize(y),normalize(z));
}
mat3 dcm_fromXZ(vec3 x, vec3 z) {
  vec3 y = -cross(x,z);
  return mat3(normalize(x),normalize(y),normalize(z));
}


int mix(int a, int b, bool cond) {
  return int(mix(float(a), float(b), cond));
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


vec3 rgb2hsv(vec3 rgb) {
  float maxval = max(rgb[0], max(rgb[1], rgb[2]));
  float minval = min(rgb[0], min(rgb[1], rgb[2]));
  int maxIndex = 0;
  for (int i=0; i<3; i++) {
    maxIndex = mix(maxIndex, i, rgb[maxIndex] < rgb[i]);
  }
  float Hs = (maxval-minval == 0.0) ? 0.0 : 1.0/6.0 *((rgb[(maxIndex+1)%3] - rgb[(maxIndex+2)%3])/(maxval-minval) +2.0*float(maxIndex));
  float H = mod(mod(Hs, 1.0) + 1.0, 1.0);
  float S = (maxval == 0.0) ? 0.0 : (maxval-minval)/maxval;
  float V = maxval;
  return vec3(H,S,V);
}
vec3 hsv2rgb(vec3 hsv) {
  float maxval = hsv[2];
  float minval = maxval*(1.0-hsv[1]);
  float Hn = mod(mod(hsv[0], 1.0) + 1.0, 1.0) * 6.0;
  int Hi = int(Hn);
  //float maxIndex = round(Hn/2.0) % 3.0;
  vec3[6] vs = vec3[](
    vec3(maxval, (Hn)*(maxval-minval)+minval, minval),
    vec3(-(Hn-2.0)*(maxval-minval)+minval, maxval, minval),
    vec3(minval, maxval, +(Hn-2.0)*(maxval-minval)+minval),
    vec3(minval, -(Hn-4.0)*(maxval-minval)+minval, maxval),
    vec3(+(Hn-4.0)*(maxval-minval)+minval, minval, maxval),
    vec3(maxval, minval, -(Hn-6.0)*(maxval-minval)+minval)
  );
  return vs[Hi];
}
