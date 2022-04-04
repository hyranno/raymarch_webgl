
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


vec3 getAmbient_constant(vec3 color) {
  return color;
}
vec3 getDiffuse_Phong(vec3 color, float metalness, vec3 normal, in Photon photon) {
  float cos_member = clamp( -dot(photon.ray.direction, normal), 0.0, 1.0 );
  vec3 f_rd = color;
  return (1.0-metalness) * f_rd * photon.color * cos_member;
}
vec3 getSpecular_Phong(float metalness, float specular, vec3 normal, in Photon photon, in Ray view) {
  float cos_member = clamp( dot(reflect(photon.ray.direction, normal), -view.direction), 0.0, 1.0 );
  float n = specular;
  float f_rs = (n + 2.0) / radians(360.0) * pow(cos_member, n);
  return metalness * f_rs * photon.color;
}
