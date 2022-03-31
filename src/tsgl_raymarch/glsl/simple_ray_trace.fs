
uniform uint camera_id;

out vec4 outColor;
void main() {
  Ray ray;
  getRay(camera_id, ray);
  float obj_distance;
  int obj = rayCast(ray, MAX_DISTANCE, obj_distance);
  vec3 point = ray.start + obj_distance*ray.direction;
  vec3 ambient = vec3(0);
  vec3 diffuse = vec3(0);
  vec3 specular = vec3(0);
  Photon photon;
  ${lights.map((l)=>`{
    light_getPhotonTo_${l.id}(point, photon);
    float light_distance;
    rayCast(photon.ray, MAX_DISTANCE, light_distance);
    float light_isHit = coef_isGreater(light_distance, length(point - photon.ray.start) - 0.4);
    ambient += getAmbient(obj, point, ray);
    diffuse += getDiffuse(obj, point, photon, ray) * light_isHit;
    specular += getSpecular(obj, point, photon, ray) * light_isHit;
  }`).join("")}
  vec3 skyColor = vec3(0.2,0,0.1);
  ambient += coef_isLesser(obj, 0) * skyColor;
  outColor = vec4(ambient + diffuse + specular, 1);
  //outColor = vec4(vec3(1,0,0), 1);
  //vec2 uv = gl_FragCoord.xy/camera_resolution;
  //outColor = vec4(vec3(1,0,0) * max(uv.x, uv.y), 1);
  //vec2 uv = (gl_FragCoord.xy/camera_resolution - vec2(0.5)) * 2.0;
  //outColor = vec4(vec3(1,0,0)*abs(uv.x) + vec3(0,0,1)*abs(uv.y), 1);
  //outColor = vec4(vec3(1,0,0)*abs(ray.start.x) + vec3(0,0,1)*abs(ray.start.y), 1);
  //outColor = vec4(vec3(1,0,0)*abs(ray.direction.x) + vec3(0,0,1)*abs(ray.direction.y), 1);
  //outColor = vec4(vec3(1,0,0) * clamp(obj_distance/5.0, 0.0, 1.0), 1);
  //outColor = vec4(vec3(1,0,0) * coef_isLesser(obj, 0), 1);
}
