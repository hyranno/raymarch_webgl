import {Vec3, Vec2, smoothmax, smoothmin, clamp} from './util';
import {GlEntity} from './gl_entity';
import {GlFloat, GlVec3, GlVec2, Transform} from './gl_types';
import {TsGlClosure} from './tsgl_closure';
import * as tsgl_closure from './tsgl_closure';
import * as tsgl_displacer from './tsgl_displacer';
import {Drawable} from './drawables';

export abstract class Shape3D extends TsGlClosure<GlFloat, [GlVec3]> {
  constructor(){
    super("getDistance", GlFloat.default(), [GlVec3.default()]);
  }
}

export class Shape3DWrapper extends Shape3D {
  original: Drawable;
  constructor(original: Drawable) {
    super();
    this.original = original;
    this.dependentGlEntities.push(original);
  }
  override tsClosure([_point]: [GlVec3]): GlFloat {
    let point = _point.value;
    return new GlFloat(this.original.getDistance(point));
  }
  GlFunc_get(): string {return `
    float ${this.glFuncName}(vec3 point) {
      return getDistance_${this.original.id}(point);
    }
  `;}
}

export class Box extends Shape3D {
  size: GlVec3;
  constructor(size: Vec3) {
    super();
    this.size = new GlVec3(size);
    this.glUniformVars.push(
      {name: "size", value: this.size},
    );
  }
  override tsClosure([_point]: [GlVec3]): GlFloat {
    let point = _point.value;
    let p_abs = point.map((v)=>Math.abs(v));
    let diff = p_abs.add(this.size.value.negative());
    let positive = diff.map((v)=>Math.max(v,0)).len();
    let negative = Math.min(0, Math.max(diff[0], diff[1], diff[2]));
    return new GlFloat(positive + negative);
  }
  override GlFunc_get(): string {
    return `float ${this.glFuncName} (vec3 point) {
      vec3 p_abs = abs(point);
      vec3 diff = p_abs - size_${this.id};
      float positive = length(max(diff, 0.0));
      float negative = min(max(diff.x, max(diff.y, diff.z)), 0.0);
      return positive + negative;
    }`;
  }
}

export class Sphere extends Shape3D {
  override tsClosure([_point]: [GlVec3]): GlFloat {
    let point = _point.value;
    return new GlFloat(point.len()-1);
  }
  override GlFunc_get(): string {
    return `float ${this.glFuncName} (vec3 point) {
      return length(point) - 1.0;
    }`;
  }
}

export class Bloated extends tsgl_closure.Map<GlFloat, [GlVec3]> {
  radius: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, radius: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(distance.value - this.radius.value),
      () => `{return v0 - radius_${this.id};}`
    );
    super("bloat", original, mapper);
    this.radius = new GlFloat(radius);
    this.glUniformVars.push({name:"radius", value:this.radius});
  }
}
export class Hollowed extends tsgl_closure.Map<GlFloat, [GlVec3]> {
  thickness: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, thickness: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(Math.abs(distance.value) - this.thickness.value),
      () => `{return abs(v0) - thickness_${this.id};}`
    );
    super("hollow", original, mapper);
    this.thickness = new GlFloat(thickness);
    this.glUniformVars.push({name:"thickness", value:this.thickness});
  }
}


export class Union extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.min(args[0].value, args[1].value) ),
      () => `{return min(v0, v1);}`
    );
    super("union", reducer, lhs, rhs);
  }
}
export class Subtraction extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, -args[1].value) ),
      () => `{return max(v0, -v1);}`
    );
    super("subtract", reducer, lhs, rhs);
  }
}
export class Intersection extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, args[1].value) ),
      () => `{return max(v0, v1);}`
    );
    super("intersection", reducer, lhs, rhs);
  }
}
export class SmoothUnion extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmin(args[0].value, args[1].value, this.smoothness.value) ),
      () => `{return smoothmin(v0, v1, smoothness_${this.id});}`
    );
    super("smoothunion", reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}
export class SmoothSubtraction extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmax(args[0].value, -args[1].value, this.smoothness.value) ),
      () => `{return smoothmax(v0, -v1, smoothness_${this.id});}`
    );
    super("smoothsub", reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}
export class SmoothIntersection extends tsgl_closure.Reduce<GlFloat, [GlVec3]> {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmax(args[0].value, args[1].value, this.smoothness.value) ),
      () => `{return smoothmax(v0, v1, smoothness_${this.id});}`
    );
    super("smoothintersection", reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}


export class RepetitionInf extends tsgl_closure.Displacement<GlFloat, GlVec3> {
  interval: GlVec3;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, interval: Vec3) {
    let displacer: TsGlClosure<GlVec3, [GlVec3]> = new tsgl_closure.Anonymous(
      `displace`, GlVec3.default(), [GlVec3.default()],
      ([point]: [GlVec3]) => {
        let origin = Vec3.fromClosure((i) => this.interval.value[i] * Math.round(point.value[i]/this.interval.value[i]));
        return new GlVec3( point.value.add(origin.negative()) );
      },
      () => `{
        vec3 origin = interval_${this.id} * round(v0 / interval_${this.id});
        return v0 - origin;
      }`
    );
    super("repete_inf_x", original, displacer);
    this.interval = new GlVec3(interval);
    this.glUniformVars.push({name:"interval", value:this.interval});
  }
}
export class RepetitionInfX extends tsgl_closure.Displacement<GlFloat, GlVec3> {
  interval: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, interval: number) {
    let displacer: TsGlClosure<GlVec3, [GlVec3]> = new tsgl_closure.Anonymous(
      `displace`, GlVec3.default(), [GlVec3.default()],
      ([point]: [GlVec3]) => {
        let origin = new Vec3(this.interval.value * Math.round(point.value[0]/this.interval.value), 0,0);
        return new GlVec3( point.value.add(origin.negative()) );
      },
      () => `{
        vec3 origin = vec3(interval_${this.id} * round(v0.x / interval_${this.id}), 0, 0);
        return v0 - origin;
      }`
    );
    super("repete_inf", original, displacer);
    this.interval = new GlFloat(interval);
    this.glUniformVars.push({name:"interval", value:this.interval});
  }
}
export class Repetition extends tsgl_closure.Displacement<GlFloat, GlVec3> {
  interval: GlVec3;
  max_indices: GlVec3;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, interval: Vec3, max_indices: Vec3) {
    let displacer: TsGlClosure<GlVec3, [GlVec3]> = new tsgl_closure.Anonymous(
      `displace`, GlVec3.default(), [GlVec3.default()],
      ([point]: [GlVec3]) => {
        let origin = Vec3.fromClosure((i) =>
          this.interval.value[i] * clamp(
            Math.round(point.value[i]/this.interval.value[i]), -this.max_indices.value[i], this.max_indices.value[i]
          )
        );
        return new GlVec3( point.value.add(origin.negative()) );
      },
      () => `{
        vec3 origin = interval_${this.id} * clamp(
          round(v0 / interval_${this.id}), -max_indices_${this.id}, max_indices_${this.id}
        );
        return v0 - origin;
      }`
    );
    super("repete", original, displacer);
    this.interval = new GlVec3(interval);
    this.max_indices = new GlVec3(max_indices);
    this.glUniformVars.push(
      {name: "interval", value: this.interval},
      {name: "max_indices", value: this.max_indices},
    );
  }
}

export class Transformed extends tsgl_closure.Map<GlFloat, [GlVec3]> {
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, transform: Transform) {
    let displacer = new tsgl_displacer.InverseTransform(transform);
    let displaced = new tsgl_closure.Displacement(`displace`, original, displacer);
    let mapper = new tsgl_closure.Anonymous<GlFloat, [GlFloat]>(
      "scale", GlFloat.default(), [GlFloat.default()],
      ([v]: [GlFloat]) => new GlFloat(v.value * transform.scale),
      () => `{return v0 * transformParams_${displacer.id}.scale;}`
    );
    super("transform", displaced, mapper);
  }
}

export class BoundingShape extends Shape3D {
  original: TsGlClosure<GlFloat, [GlVec3]>;
  bounding: TsGlClosure<GlFloat, [GlVec3]>;
  margin: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, bounding: TsGlClosure<GlFloat, [GlVec3]>, margin: number) {
    super();
    this.margin = new GlFloat(margin);
    this.original = original;
    this.bounding = bounding;
    this.dependentGlEntities.push(original, bounding);
    this.glUniformVars.push({name:"margin", value:this.margin});
  }
  override tsClosure(args: [GlVec3]): GlFloat {
    let res = this.bounding.tsClosure(args);
    if (res.value < this.margin.value) {
      res = this.original.tsClosure(args);
    }
    return res;
  }
  override GlFunc_get(): string {
    return `float ${this.glFuncName} (vec3 point) {
      float res = ${this.bounding.glFuncName}(point);
      if (res < margin_${this.id}) {
        res = ${this.original.glFuncName}(point);
      }
      return res;
    }`;
  }
}


export class Extrusion extends Shape3D {
  shape2d: TsGlClosure<GlFloat, [GlVec2]>;
  thickness: GlFloat;
  constructor(shape2d: TsGlClosure<GlFloat, [GlVec2]>, thickness: GlFloat) {
    super();
    this.shape2d = shape2d;
    this.thickness = thickness;
    this.dependentGlEntities.push(shape2d);
    this.glUniformVars.push({name: "thickness", value: this.thickness});
  }
  override tsClosure([_point]: [GlVec3]): GlFloat {
    let point = _point.value;
    let distance2d = this.shape2d.tsClosure([new GlVec2(new Vec2(point[0], point[1]))]).value;
    let distanceZ = Math.abs(point[2]) - this.thickness.value;
    let negative = Math.min(Math.max(distance2d, distanceZ), 0);
    let positive = (new Vec2(Math.max(distance2d,0), Math.max(distanceZ,0))).len();
    return new GlFloat(negative + positive);
  }
  override GlFunc_get(): string {return `
    float ${this.glFuncName} (vec3 point) {
      float distance2d = ${this.shape2d.glFuncName}(point.xy);
      float distanceZ = abs(point.z) - thickness_${this.id};
      vec2 d = vec2(distance2d, distanceZ);
      float negative = min(max(d.x, d.y), 0.0);
      float positive = length(max(d, 0.0));
      return negative + positive;
    }
  `;}
}
export class Revolution extends Shape3D {
  shape2d: TsGlClosure<GlFloat, [GlVec2]>;
  constructor(shape2d: TsGlClosure<GlFloat, [GlVec2]>) {
    super();
    this.shape2d = shape2d;
    this.dependentGlEntities.push(shape2d);
  }
  override tsClosure([_point]: [GlVec3]): GlFloat {
    let point = _point.value;
    let p = new Vec2( (new Vec2(point[0], point[2])).len(), point[1] );
    return this.shape2d.tsClosure([new GlVec2(p)]);
  }
  override GlFunc_get(): string {return `
    float ${this.glFuncName} (vec3 point) {
      vec2 p = vec2(length(point.xz), point.y);
      return ${this.shape2d.glFuncName}(p);
    }
  `;}
}
