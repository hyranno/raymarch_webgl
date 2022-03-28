
${drawables.map((d) => `
  ${d.getGlVars()}
  float getDistance_${d.id} (vec3 point) {
    float obj_distance;
    ${d.shape.GlFunc_getDistance()}
    return obj_distance;
  }
  vec3 getNormal_${d.id} (vec3 point) {
    return normalize(vec3(
      getDistance_${d.id}(point+vec3(+EPS,0,0)) - getDistance_${d.id}(point+vec3(-EPS,0,0)),
      getDistance_${d.id}(point+vec3(0,+EPS,0)) - getDistance_${d.id}(point+vec3(0,-EPS,0)),
      getDistance_${d.id}(point+vec3(0,0,+EPS)) - getDistance_${d.id}(point+vec3(0,0,-EPS))
    ));
  }
  vec3 getAmbient_${d.id} (vec3 point, in Ray view) {
    vec3 color;
    vec3 normal = getNormal_${d.id}(point);
    ${d.material.GlFunc_getAmbient()}
    return color;
  }
  vec3 getDiffuse_${d.id} (vec3 point, in Photon photon, in Ray view) {
    vec3 color;
    vec3 normal = getNormal_${d.id}(point);
    ${d.material.GlFunc_getDiffuse()}
    return color;
  }
  vec3 getSpecular_${d.id} (vec3 point, in Photon photon, in Ray view) {
    vec3 color;
    vec3 normal = getNormal_${d.id}(point);
    ${d.material.GlFunc_getSpecular()}
    return color;
  }
`).join("")}


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
