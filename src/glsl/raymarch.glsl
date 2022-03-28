
/**
* @return index of Drawable. Negative if None.
*/
int findNearestDrawable(in Ray ray, out float obj_distance) {
  float prev_id = -1.0;
  float prev_distance = MAX_DISTANCE;
  ${drawables.map((d)=>`{
    float current_distance = getDistance_${d.id}(ray.start);
    float direction_match = current_distance * dot(getNormal_${d.id}(ray.start), ray.direction);
    float cond = /*coef_isGreater(0.0, direction_match)* */ coef_isLesser(abs(current_distance), abs(prev_distance));
    prev_id = mix(float(prev_id), float(${d.id}), cond);
    prev_distance = mix(prev_distance, current_distance, cond);
  }`).join("")}
  obj_distance = prev_distance;
  return int(prev_id);
}

/**
* @return index of Drawable. Negative if None.
*/
int rayCast(in Ray ray, float max_distance, out float obj_distance) {
  Ray r = ray;
  float l = 0.0;
  while (l < max_distance) {
    float sd; //signed
    int nearest = findNearestDrawable(r, sd);
    if (abs(sd) < EPS) {
      obj_distance = l;
      return nearest;
    }
    l += sd;
    r.start = ray.start + l * ray.direction;
  }
  obj_distance = max_distance;
  return -1;
}


void camera_constructor(
  out Camera res,
  vec3 position, vec3 upper_center, vec3 center_right, float origin_distance
) {
  res.position = position;
  res.screen_size = vec2(length(center_right), length(upper_center));
  res.origin_distance = origin_distance;
  vec3 x = normalize(center_right);
  vec3 y = normalize(upper_center);
  res.rotation = quaternion_fromDCM( dcm_fromXY(x,y) );
}
void camera_getRay(in Camera cam, vec2 resolution, out Ray ray) {
  vec2 pixel = gl_FragCoord.xy;
  vec2 screen_pos = (pixel / resolution - vec2(0.5)) * cam.screen_size;
  vec3 rotated_pos = quaternion_rot3(cam.rotation, vec3(screen_pos,0.0));
  vec3 rotated_origin = quaternion_rot3(cam.rotation, vec3(0,0,cam.origin_distance));
  ray.start = cam.position + rotated_pos;
  ray.direction = normalize(rotated_pos - rotated_origin);
}
