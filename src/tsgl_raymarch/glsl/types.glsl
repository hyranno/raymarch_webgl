/* float */
float add(float v1, float v2) {
  return v1 + v2;
}
float mul(float scale, float v) {
  return scale * v;
}
/* vec2 */
vec2 add(vec2 v1, vec2 v2) {
  return v1 + v2;
}
vec2 mul(float scale, vec2 v) {
  return scale * v;
}
vec2 mix(vec2 a, vec2 b, bool cond) {
  return mix(a, b, bvec2(cond));
}
/* vec3 */
vec3 add(vec3 v1, vec3 v2) {
  return v1 + v2;
}
vec3 mul(float scale, vec3 v) {
  return scale * v;
}
vec3 mix(vec3 a, vec3 b, bool cond) {
  return mix(a, b, bvec3(cond));
}

/* int */
int add(int v1, int v2) {
  return v1 + v2;
}
int mul(float scale, int v) {
  return int(scale * float(v));
}
int mix(int a, int b, bool cond) {
  return int(mix(float(a), float(b), cond));
}

/* TexturePatch */
TexturePatch add(TexturePatch v1, TexturePatch v2) {
  TexturePatch res;
  res.albedo = add(v1.albedo, v2.albedo);
  res.roughness = add(v1.roughness, v2.roughness);
  res.specular = add(v1.specular, v2.specular);
  res.point = v1.point;
  res.normal = v1.normal;
  return res;
}
TexturePatch mul(float scale, TexturePatch v) {
  TexturePatch res;
  res.albedo = mul(scale, v.albedo);
  res.roughness = mul(scale, v.roughness);
  res.specular = mul(scale, v.specular);
  res.point = v.point;
  res.normal = v.normal;
  return res;
}
TexturePatch mix(TexturePatch v1, TexturePatch v2, float weight) {
  TexturePatch res;
  res.albedo = mix(v1.albedo, v2.albedo, weight);
  res.roughness = mix(v1.roughness, v2.roughness, weight);
  res.specular = mix(v1.specular, v2.specular, weight);
  res.point = v1.point;
  res.normal = v1.normal;
  return res;
}
TexturePatch mix(TexturePatch v1, TexturePatch v2, bool weight) {
  TexturePatch res;
  res.albedo = mix(v1.albedo, v2.albedo, weight);
  res.roughness = mix(v1.roughness, v2.roughness, weight);
  res.specular = mix(v1.specular, v2.specular, weight);
  res.point = v1.point;
  res.normal = v1.normal;
  return res;
}
