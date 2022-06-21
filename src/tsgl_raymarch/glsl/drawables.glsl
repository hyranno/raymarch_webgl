
${drawables.map((d) => d.getGlImplements()).join("")}


float getDistance(int id, vec3 point) {
  float res = MAX_DISTANCE;
  ${drawables.map((d)=>`
    if (id==${d.id}) {
      res = getDistance_${d.id}(point);
    }
  `).join("")}
  return res;
}
vec3 getNormal(int id, vec3 point) {
  vec3 res = vec3(1,0,0);
  ${drawables.map((d)=>`
    if (id==${d.id}) {
      res = getNormal_${d.id}(point);
    }
  `).join("")}
  return res;
}
vec3 calcAmbient(int id, vec3 point, in vec3 intensity, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    if (id==${d.id}) {
      res = calcAmbient_${d.id}(point, getNormal_${d.id}(point), intensity, view);
    }
  `).join("")}
  return res;
}
vec3 calcDiffuse(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    if (id==${d.id}) {
      res = calcDiffuse_${d.id}(point, getNormal_${d.id}(point), photon, view);
    }
  `).join("")}
  return res;
}
vec3 calcSpecular(int id, vec3 point, in Photon photon, in Ray view) {
  vec3 res = vec3(0);
  ${drawables.map((d)=>`
    if (id==${d.id}) {
      res = calcSpecular_${d.id}(point, getNormal_${d.id}(point), photon, view);
    }
  `).join("")}
  return res;
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
