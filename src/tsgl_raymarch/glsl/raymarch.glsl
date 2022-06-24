
/**
* @return index of Drawable. Negative if None.
*/
int findNearestDrawable(in Ray ray, out float obj_distance) {
  int prev_id = -1;
  float prev_distance = MAX_DISTANCE;
  ${drawables.map((d)=>`{
    float current_distance = getDistance_${d.id}(ray.start);
    float direction_match = current_distance * dot(getNormal_${d.id}(ray.start), ray.direction);
    bool cond = /*direction_match<0.0 && */ abs(current_distance) < abs(prev_distance);
    prev_id = select(prev_id, ${d.id}, cond);
    prev_distance = select(prev_distance, current_distance, cond);
  }`).join("")}
  obj_distance = prev_distance;
  return int(prev_id);
}

/**
* @return index of Drawable. Negative if None.
*/
int rayCast(in Ray ray, float max_distance, out float obj_distance) {
  const int MAX_ITERATION = 256;
  Ray r = ray;
  float l = 0.0;
  for (int i=0; i < MAX_ITERATION && l < max_distance; i++) {
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
