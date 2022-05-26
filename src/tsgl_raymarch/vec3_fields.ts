import * as util from './util';
import {GlEntity, Transform} from './gl_entity';
import * as fields from './scalar_fields';

export abstract class Vec3Field extends GlEntity {
  abstract GlFunc_get(): string;
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 get_${this.id} (vec3 point);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_get()}
  `;}
}

export class FromXYZ extends Vec3Field {
  x: fields.ScalarField;
  y: fields.ScalarField;
  z: fields.ScalarField;
  constructor(x: fields.ScalarField, y: fields.ScalarField, z: fields.ScalarField) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
    this.dependentGlEntities.push(x,y,z);
  }
  override GlFunc_get(): string { return `vec3 get_${this.id} (vec3 point) {
    return vec3(get_${this.x.id}(point), get_${this.y.id}(point), get_${this.z.id}(point));
  }`;}
}

export class FromPolar extends Vec3Field {
  radius: fields.ScalarField;
  yaw: fields.ScalarField;
  pitch: fields.ScalarField;
  constructor(radius: fields.ScalarField, yaw: fields.ScalarField, pitch: fields.ScalarField) {
    super();
    this.radius = radius;
    this.yaw = yaw;
    this.pitch = pitch;
    this.dependentGlEntities.push(radius, yaw, pitch);
  }
  override GlFunc_get(): string { return `vec3 get_${this.id} (vec3 point) {
    return coord_PolarToOrthogonal(vec3(get_${this.radius.id}(point), get_${this.yaw.id}(point), get_${this.pitch.id}(point)));
  }`;}
}

export class FromHSV extends Vec3Field {
  h: fields.ScalarField;
  s: fields.ScalarField;
  v: fields.ScalarField;
  constructor(h: fields.ScalarField, s: fields.ScalarField, v: fields.ScalarField) {
    super();
    this.h = h;
    this.s = s;
    this.v = v;
    this.dependentGlEntities.push(h,s,v);
  }
  override GlFunc_get(): string { return `vec3 get_${this.id} (vec3 point) {
    vec3 hsv = vec3(get_${this.h.id}(point), get_${this.s.id}(point), get_${this.v.id}(point));
    return hsv2rgb(hsv);
  }`;}
}

export class SimplexInterpolation extends Vec3Field {
  discrete: Vec3Field;
  localField: fields.ScalarField;
  constructor(discrete: Vec3Field, localField: fields.ScalarField) {
    super();
    this.discrete = discrete;
    this.localField = localField;
    this.dependentGlEntities.push(discrete, localField);
  }
  override GlFunc_get(): string { return `vec3 get_${this.id} (vec3 point) {
    vec3 res = vec3(0);
    vec3[13] origins = simplex3_neighbors( coord_OrthogonalToSimplex3(point) );
    for (int i=0; i<origins.length(); i++) {
      vec3 p = coord_Simplex3ToOrthogonal( origins[i] );
      vec3 val = get_${this.discrete.id}(p);
      res += val * get_${this.localField.id}( point - p );
    }
    return res;
  }`;}
}

export class FractionalBrownianMotion extends Vec3Field {
  gain: number;
  depth: number;
  offset: util.Vec3;
  layer: Vec3Field;
  constructor (gain: number, depth: number, offset: util.Vec3, layer: Vec3Field) {
    super();
    this.gain = gain;
    this.depth = depth;
    this.offset = offset;
    this.layer = layer;
    this.dependentGlEntities.push(layer);
  }
  override GlFunc_get(): string { return `vec3 get_${this.id} (vec3 point) {
    vec3 res = vec3(0);
    float a = 1.0;
    vec3 p = point;
    for (int i=0; i < depth_${this.id}; i++) {
      res += a * get_${this.layer.id}(p);
      a *= gain_${this.id};
      p = 2.0*p + offset_${this.id};
    }
    return res;
  }`;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float gain_${this.id};
    uniform int depth_${this.id};
    uniform vec3 offset_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `gain_${this.id}`, this.gain);
    GlEntity.setGlUniformInt(gl, program, `depth_${this.id}`, this.depth);
    GlEntity.setGlUniformVec3(gl, program, `offset_${this.id}`, this.offset);
  }
}
