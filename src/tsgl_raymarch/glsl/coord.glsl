
vec3 coord_OrthogonalToTetrahedron(vec3 p){ return InvTetrahedronBasis*p; }
vec3 coord_TetrahedronToOrthogonal(vec3 p){ return TetrahedronBasis*p; }


vec3[8] coord_rounds(vec3 point){
  vec3 ptf = floor(point), ptc = floor(point + vec3(1.0));
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
