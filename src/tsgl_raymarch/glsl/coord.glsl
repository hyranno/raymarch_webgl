
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

vec3[13] simplex3_neighbors(vec3 point) {
  vec3 center = round(point);
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
