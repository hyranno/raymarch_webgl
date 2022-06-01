import * as util from './util';
import {GlClosure} from './gl_closure';
import {GlInt, GlFloat, GlVec3} from './gl_types';

export abstract class Vec3Field extends GlClosure<GlVec3, [GlVec3]> {
  constructor(){
    super("get", GlVec3.default(), [GlVec3.default()]);
  }
}

export class FromXYZ extends Vec3Field {
  x: GlClosure<GlFloat, [GlVec3]>;
  y: GlClosure<GlFloat, [GlVec3]>;
  z: GlClosure<GlFloat, [GlVec3]>;
  constructor(x: GlClosure<GlFloat, [GlVec3]>, y: GlClosure<GlFloat, [GlVec3]>, z: GlClosure<GlFloat, [GlVec3]>) {
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
  radius: GlClosure<GlFloat, [GlVec3]>;
  yaw: GlClosure<GlFloat, [GlVec3]>;
  pitch: GlClosure<GlFloat, [GlVec3]>;
  constructor(radius: GlClosure<GlFloat, [GlVec3]>, yaw: GlClosure<GlFloat, [GlVec3]>, pitch: GlClosure<GlFloat, [GlVec3]>) {
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
  h: GlClosure<GlFloat, [GlVec3]>;
  s: GlClosure<GlFloat, [GlVec3]>;
  v: GlClosure<GlFloat, [GlVec3]>;
  constructor(h: GlClosure<GlFloat, [GlVec3]>, s: GlClosure<GlFloat, [GlVec3]>, v: GlClosure<GlFloat, [GlVec3]>) {
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
  discrete: GlClosure<GlVec3, [GlVec3]>;
  localField: GlClosure<GlFloat, [GlVec3]>;
  constructor(discrete: GlClosure<GlVec3, [GlVec3]>, localField: GlClosure<GlFloat, [GlVec3]>) {
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
  gain: GlFloat;
  depth: GlInt;
  offset: GlVec3;
  layer: GlClosure<GlVec3, [GlVec3]>;
  constructor (gain: number, depth: number, offset: util.Vec3, layer: GlClosure<GlVec3, [GlVec3]>) {
    super();
    this.gain = new GlFloat(gain);
    this.depth = new GlInt(depth);
    this.offset = new GlVec3(offset);
    this.layer = layer;
    this.dependentGlEntities.push(layer);
    this.glUniformVars.push(
      {name: "gain", value: this.gain},
      {name: "depth", value: this.depth},
      {name: "offset", value: this.offset},
    );
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
}
