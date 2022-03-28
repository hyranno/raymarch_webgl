/* required TypeScript vars, func
drawables, lights
*/

/*constants*/
const float EPS = 0.001;
const float MAX_DISTANCE = 2048.0; //2^11
const uint numDrawables = uint(${drawables.length});
const uint numLights = uint(${lights.length});


/*struct types*/
struct Ray {
  vec3 start;
  vec3 direction;
};
struct Photon {
  Ray ray;
  vec3 color;
};
struct Camera {
  vec3 position;
  vec4 rotation;
  vec2 screen_size;
  float origin_distance;
};

/*util.glsl*/
float coef_isEqual(float a, float b);
float coef_isEqual(int a, int b);
float coef_notEqual(float a, float b);
float coef_notEqual(int a, int b);
float coef_isGreater(float a, float b);
float coef_isGreater(int a, int b);
float coef_isLesser(float a, float b);
float coef_isLesser(int a, int b);

vec4 quaternion_fromDCM(mat3 dcm);
vec4 quaternion_fromAngleAxis(float angle, vec3 axis);
vec4 quaternion_inverse(vec4 q);
vec4 quaternion_mul(vec4 q0, vec4 q1);
vec3 quaternion_rot3(vec4 q, vec3 v);
mat3 dcm_fromXY(vec3 x, vec3 y);


/*lights*/
${lights.map((l)=>`
  void light_getPhotonTo_${l.id} (vec3 point, out Photon photon);
  //void light_getPhoton_${l.id} (out Ray ray); //called by photon mapper, vary with thread_id
`).join("")}


/*drawables*/
${drawables.map((d) => `
  float getDistance_${d.id} (vec3 point);
  vec3 getNormal_${d.id} (vec3 point);
  vec3 getAmbient_${d.id} (vec3 point, in Ray view);
  vec3 getDiffuse_${d.id} (vec3 point, in Photon photon, in Ray view);
  vec3 getSpecular_${d.id} (vec3 point, in Photon photon, in Ray view);
`).join("")}
float getDistance(int id, vec3 point);
vec3 getNormal(int id, vec3 point);
vec3 getAmbient(int id, vec3 point, in Ray view);
vec3 getDiffuse(int id, vec3 point, in Photon photon, in Ray view);
vec3 getSpecular(int id, vec3 point, in Photon photon, in Ray view);


/*raymarch*/
int findNearestDrawable(in Ray ray, out float obj_distance);
int rayCast(in Ray ray, float max_distance, out float obj_distance);
void camera_constructor(out Camera res, vec3 position, vec3 upper_center, vec3 center_right, float origin_distance);
void camera_getRay(in Camera cam, vec2 resolution, out Ray ray);
