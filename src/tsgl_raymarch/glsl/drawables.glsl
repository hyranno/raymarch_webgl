
${drawables.map((d) => d.getGlImplements()).join("")}


float getDistance(int id, vec3 point) {
  float res = MAX_DISTANCE;
  ${drawables.map((d)=>`
    // res += getDistance_${d.id}(point) * mix(0.0, 1.0, ${d.id}==id);
    if (id==${d.id}) {
      res = getDistance_${d.id}(point);
    }
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
vec3 calcAmbient(int id, vec3 point, in vec3 intensity, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    // res += calcAmbient_${d.id}(point, view) * mix(0.0, 1.0, ${d.id}==id);
    if (id==${d.id}) {
      res = calcAmbient_${d.id}(point, vec3(0), intensity, view);
    }
  `).join("")}
  return res;
}
vec3 calcDiffuse(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    // res += calcDiffuse_${d.id}(point, vec3(0), photon, view) * mix(0.0, 1.0, ${d.id}==id);
    if (id==${d.id}) {
      res = calcDiffuse_${d.id}(point, vec3(0), photon, view);
    }
  `).join("")}
  return res;
}
vec3 calcSpecular(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    // res += calcSpecular_${d.id}(point, vec3(0), photon, view) * mix(0.0, 1.0, ${d.id}==id);
    if (id==${d.id}) {
      res = calcSpecular_${d.id}(point, vec3(0), photon, view);
    }
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


vec3 calcAmbient_constant(in TexturePatch p, in vec3 intensity, in Ray view) {
  float cos_member = clamp( dot(-view.direction, p.normal), 0.0, 1.0 );
  return p.albedo * intensity * cos_member;
}
vec3 calcDiffuse_Phong(in TexturePatch p, in Photon photon) {
  float cos_member = clamp( -dot(photon.ray.direction, p.normal), 0.0, 1.0 );
  vec3 f_rd = p.albedo;
  return p.roughness * f_rd * photon.color * cos_member;
}
vec3 calcSpecular_Phong(in TexturePatch p, in Photon photon, in Ray view) {
  float cos_member = clamp( dot(reflect(photon.ray.direction, p.normal), -view.direction), 0.0, 1.0 );
  float n = p.specular;
  float f_rs = (n + 2.0) / radians(360.0) * pow(cos_member, n);
  return (1.0-p.roughness) * f_rs * photon.color;
}
