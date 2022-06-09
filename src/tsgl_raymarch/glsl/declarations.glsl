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
struct TexturePatch {
  vec3 albedo;
  float roughness;
  float specular;
  vec3 point;
  vec3 normal;
};

/*types.glsl*/
float add(float v1, float v2);
vec2 add(vec2 v1, vec2 v2);
vec3 add(vec3 v1, vec3 v2);
int add(int v1, int v2);
TexturePatch add(TexturePatch v1, TexturePatch v2);
float mul(float scale, float v);
vec2 mul(vec2 scale, vec2 v);
vec3 mul(vec3 scale, vec3 v);
int mul(float scale, int v);
TexturePatch mul(float scale, TexturePatch v);
vec2 mix(vec2 a, vec2 b, bool cond);
vec3 mix(vec3 a, vec3 b, bool cond);
int mix(int a, int b, bool cond);
TexturePatch mix(TexturePatch a, TexturePatch b, float weight);
TexturePatch mix(TexturePatch a, TexturePatch b, bool weight);

/*util.glsl*/
vec4 quaternion_fromDCM(mat3 dcm);
vec4 quaternion_fromAngleAxis(float angle, vec3 axis);
vec4 quaternion_fromSrcDest(vec3 src, vec3 dest);
vec4 quaternion_inverse(vec4 q);
vec4 quaternion_mul(vec4 q0, vec4 q1);
vec3 quaternion_rot3(vec4 q, vec3 v);
mat3 dcm_fromXY(vec3 x, vec3 y);

#define DECLARE_SWAP(TYPE) \
  void swap(inout TYPE v1, inout TYPE v2);\
  void swap(inout TYPE v1, inout TYPE v2, bool cond);
DECLARE_SWAP(float)
DECLARE_SWAP(int)

float blend(float v1, float v2, bool isMin, float smoothness, float weight);
float smoothmin(float v1, float v2, float smoothness);
float smoothmax(float v1, float v2, float smoothness);
float smoothclamp(float v, float bottom, float top, float smoothness);

vec3 rgb2hsv(vec3 rgb);
vec3 hsv2rgb(vec3 hsv);

/*random*/
uint rotr16(uint x, uint shift);
void PCG16_init(uint seed, out uint state);
uint PCG16_rand(inout uint state);
uint hash32(uint data, uint seed);
${(new Array(5).fill(0)).map((_, maxIndex) => `
  uint hash32(uint data[${maxIndex+1}]);
`).join("")}
uint hash32(vec2 data);
uint hash32(vec3 data);
uint hash32(vec4 data);

/*coord*/
const mat3 Simplex3Basis = mat3(
  vec3(cos(radians(180.0)/6.0), +sin(radians(180.0)/6.0), 0),
  vec3(cos(radians(180.0)/6.0), -sin(radians(180.0)/6.0), 0),
  vec3(sqrt(1.0/3.0), 0, sqrt(2.0/3.0))
);
const mat3 InvSimplex3Basis = inverse(Simplex3Basis);
const vec3 Simplex3Center = (
  +vec3(cos(radians(180.0)/6.0), +sin(radians(180.0)/6.0), 0)
  +vec3(cos(radians(180.0)/6.0), -sin(radians(180.0)/6.0), 0)
  +vec3(sqrt(1.0/3.0), 0, sqrt(2.0/3.0))
) / 4.0;
vec3 coord_OrthogonalToPolar(vec3 p);
vec3 coord_PolarToOrthogonal(vec3 p);
vec3 coord_OrthogonalToSimplex3(vec3 p);
vec3 coord_Simplex3ToOrthogonal(vec3 p);
vec3[8] coord_rounds(vec3 point);
vec3 simplex3_round(vec3 point);
float simplex3_length(vec3 vec);
vec3[13] simplex3_neighbors(vec3 point);

/*camera*/
${cameras.map((c) => c.getGlDeclarations()).join("")}
void getRay(uint id, out Ray ray);

/*lights*/
${lights.map((l) => l.getGlDeclarations()).join("")}

/*drawables*/
${drawables.map((d) => d.getGlDeclarations()).join("")}
float getDistance(int id, vec3 point);
vec3 getNormal(int id, vec3 point);
vec3 calcAmbient(int id, vec3 point, in vec3 intensity, in Ray view);
vec3 calcDiffuse(int id, vec3 point, in Photon photon, in Ray view);
vec3 calcSpecular(int id, vec3 point, in Photon photon, in Ray view);

vec3 coord_transform(in Transform t, vec3 point);
vec3 coord_inverse(in Transform t, vec3 point);
Ray coord_transform(in Transform t, in Ray ray);
Ray coord_inverse(in Transform t, in Ray ray);

vec3 calcAmbient_constant(in TexturePatch p, in vec3 intensity, in Ray view);
vec3 calcDiffuse_Phong(in TexturePatch p, in Photon photon);
vec3 calcSpecular_Phong(in TexturePatch p, in Photon photon, in Ray view);

/*raymarch*/
int findNearestDrawable(in Ray ray, out float obj_distance);
int rayCast(in Ray ray, float max_distance, out float obj_distance);
