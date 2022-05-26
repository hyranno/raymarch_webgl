
vec3 coord_transform(in Transform t, vec3 point) {
  return quaternion_rot3(t.rotation, point * t.scale) + t.translate;
}
vec3 coord_inverse(in Transform t, vec3 point) {
  return quaternion_rot3(quaternion_inverse(t.rotation), point - t.translate) / t.scale;
}
Ray coord_transform(in Transform t, in Ray ray) {
  return Ray(
    coord_transform(t, ray.start),
    quaternion_rot3(t.rotation, ray.direction)
  );
}
Ray coord_inverse(in Transform t, in Ray ray) {
  return Ray(
    coord_inverse(t, ray.start),
    quaternion_rot3(quaternion_inverse(t.rotation), ray.direction)
  );
}

vec3 coord_OrthogonalToPolar(vec3 p){
  return vec3(length(p), atan(p.z, p.x), asin(normalize(p).y));
}
vec3 coord_PolarToOrthogonal(vec3 p){
  return p.x * vec3(cos(p.z)*cos(p.y), sin(p.z), cos(p.z)*sin(p.y));
}

vec3 coord_OrthogonalToSimplex3(vec3 p){ return InvSimplex3Basis*p; }
vec3 coord_Simplex3ToOrthogonal(vec3 p){ return Simplex3Basis*p; }


vec3[8] coord_rounds(vec3 point){
  vec3 ptf = floor(point);
  vec3 ptc = ptf + 1.0;
  return vec3[](
    ptf,
    vec3(ptf.x, ptf.y, ptc.z),
    vec3(ptf.x, ptc.y, ptf.z),
    vec3(ptf.x, ptc.y, ptc.z),
    vec3(ptc.x, ptf.y, ptf.z),
    vec3(ptc.x, ptf.y, ptc.z),
    vec3(ptc.x, ptc.y, ptf.z),
    ptc
  );
}

vec3 simplex3_round(vec3 point) {
  vec3[8] r = coord_rounds(point);
  vec3 nearest = r[0];
  for (int i=1; i<r.length(); i++) {
    nearest = mix( nearest, r[i], mix(0.0,1.0,simplex3_length(r[i]-point) < simplex3_length(nearest-point)) );
  }
  return nearest;
}
float simplex3_length(vec3 vec) {
  return length( coord_Simplex3ToOrthogonal(vec) );
}
vec3[13] simplex3_neighbors(vec3 point) {
  vec3 center = simplex3_round(point);
  return vec3[](
    center,
    center + vec3(+1, 0, 0),
    center + vec3( 0,+1, 0),
    center + vec3( 0, 0,+1),
    center + vec3(-1, 0, 0),
    center + vec3( 0,-1, 0),
    center + vec3( 0, 0,-1),
    center + vec3(+1,-1, 0),
    center + vec3(+1, 0,-1),
    center + vec3(-1,+1, 0),
    center + vec3( 0,+1,-1),
    center + vec3(-1, 0,+1),
    center + vec3( 0,-1,+1)
  );
}
