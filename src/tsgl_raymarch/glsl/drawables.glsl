
${drawables.map((d) => d.getGlImplements()).join("")}


float getDistance(int id, vec3 point) {
  float res = 0.0;
  ${drawables.map((d)=>`
    res += getDistance_${d.id}(point) * coef_isEqual(${d.id}, id);
  `).join("")}
  return res;
}
vec3 getNormal(int id, vec3 point) {
  vec3 v = vec3(
    getDistance(id, point+vec3(+EPS,0,0)) - getDistance(id, point+vec3(-EPS,0,0)),
    getDistance(id, point+vec3(0,+EPS,0)) - getDistance(id, point+vec3(0,-EPS,0)),
    getDistance(id, point+vec3(0,0,+EPS)) - getDistance(id, point+vec3(0,0,-EPS))
  );
  return normalize(v);
}
vec3 getAmbient(int id, vec3 point, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    res += getAmbient_${d.id}(point, view) * coef_isEqual(${d.id}, id);
  `).join("")}
  return res;
}
vec3 getDiffuse(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    res += getDiffuse_${d.id}(point, photon, view) * coef_isEqual(${d.id}, id);
  `).join("")}
  return res;
}
vec3 getSpecular(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    res += getSpecular_${d.id}(point, photon, view) * coef_isEqual(${d.id}, id);
  `).join("")}
  return res;
}
