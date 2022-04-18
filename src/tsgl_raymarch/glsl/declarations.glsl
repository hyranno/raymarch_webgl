/* required TypeScript vars, func
cameras, drawables, lights
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
struct Transform {
  vec3 translate;
  vec4 rotation;
  float scale;
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

uint rotr16(uint x, uint shift);
void PCG16_init(uint seed, out uint state);
uint PCG16_rand(inout uint state);
uint hash32(uint data, uint seed);
${(new Array(5)).map((_, dataLen) => `
  uint hash32(uint data[${dataLen$}]);
`).join("")}


/*camera*/
${cameras.map((c) => c.getGlDeclarations()).join("")}
void getRay(uint id, out Ray ray);

/*lights*/
${lights.map((l) => l.getGlDeclarations()).join("")}

/*drawables*/
${drawables.map((d) => d.getGlDeclarations()).join("")}
float getDistance(int id, vec3 point);
vec3 getNormal(int id, vec3 point);
vec3 getAmbient(int id, vec3 point, in Ray view);
vec3 getDiffuse(int id, vec3 point, in Photon photon, in Ray view);
vec3 getSpecular(int id, vec3 point, in Photon photon, in Ray view);

vec3 coord_transform(in Transform t, vec3 point);
vec3 coord_inverse(in Transform t, vec3 point);
Ray coord_transform(in Transform t, in Ray ray);
Ray coord_inverse(in Transform t, in Ray ray);

vec3 getAmbient_constant(vec3 color);
vec3 getDiffuse_Phong(vec3 color, float metalness, vec3 normal, in Photon photon);
vec3 getSpecular_Phong(float metalness, float specular, vec3 normal, in Photon photon, in Ray view);


/*raymarch*/
int findNearestDrawable(in Ray ray, out float obj_distance);
int rayCast(in Ray ray, float max_distance, out float obj_distance);
