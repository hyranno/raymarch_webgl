
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
