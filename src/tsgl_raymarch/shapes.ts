import {Vec3, Vec2, smoothmax, smoothmin, clamp} from './util';
import {GlEntity} from './gl_entity';
import {GlFloat, GlVec3, GlVec2, Transform} from './gl_types';
import {TsGlClosure} from './tsgl_closure';
import * as tsgl_closure from './tsgl_closure';

export interface HasShape {
  getDistance(point: Vec3): number;
  GlFunc_getDistance(): string; //float getDistance_${this.id} (vec3 point);
  getNormal(point: Vec3): Vec3;
  GlFunc_getNormal(): string;
}
export abstract class Shape3D extends GlEntity implements HasShape, TsGlClosure<GlFloat, [GlVec3]> {
  abstract getDistance(point: Vec3): number;
  abstract GlFunc_getDistance(): string;
  constructor() {
    super();
    this.argTypedDummies = [GlVec3.default()];
    this.returnTypedDummy = GlFloat.default();
    this.glFuncName = `getDistance_${this.id}`;
  }
  readonly argTypedDummies: [GlVec3];
  readonly returnTypedDummy: GlFloat;
  readonly glFuncName: string;
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float getDistance_${this.id} (vec3 point);
    vec3 getNormal_${this.id} (vec3 point);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getDistance()}
    ${this.GlFunc_getNormal()}
  `;}
  getNormal(point: Vec3): Vec3 {
    const EPS = 0.0001;
    let v: Vec3 = new Vec3(
      this.getDistance(point.add(new Vec3(+EPS,0,0))) - this.getDistance(point.add(new Vec3(-EPS,0,0))),
      this.getDistance(point.add(new Vec3(0,+EPS,0))) - this.getDistance(point.add(new Vec3(0,-EPS,0))),
      this.getDistance(point.add(new Vec3(0,0,+EPS))) - this.getDistance(point.add(new Vec3(0,0,-EPS))),
    );
    return v.normalize();
  }
  GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      return normalize(vec3(
        getDistance_${this.id}(point+vec3(+EPS,0,0)) - getDistance_${this.id}(point+vec3(-EPS,0,0)),
        getDistance_${this.id}(point+vec3(0,+EPS,0)) - getDistance_${this.id}(point+vec3(0,-EPS,0)),
        getDistance_${this.id}(point+vec3(0,0,+EPS)) - getDistance_${this.id}(point+vec3(0,0,-EPS))
      ));
    }`;
  }
  getGlFuncDeclaration(): string { return `
    float getDistance_${this.id} (vec3 point)
  `;}
  tsClosure([point]: [GlVec3]): GlFloat {
    return new GlFloat(this.getDistance(point.value));
  }
  GlFunc_get(): string {
    return this.GlFunc_getDistance();
  }
}

export class Shape3DWrapper extends Shape3D {
  original: GlEntity & HasShape;
  constructor(original: GlEntity & HasShape) {
    super();
    this.original = original;
    this.dependentGlEntities.push(original);
  }
  getDistance(point: Vec3): number {
    return this.original.getDistance(point);
  }
  GlFunc_getDistance(): string {return `
    float getDistance_${this.id}(vec3 point) {
      return getDistance_${this.original.id}(point);
    }
  `;}
}
export class FromSdfClosure extends Shape3D {
  signedDistanceFunction: TsGlClosure<GlFloat, [GlVec3]>;
  constructor(signedDistanceFunction: TsGlClosure<GlFloat, [GlVec3]>) {
    super();
    this.signedDistanceFunction = signedDistanceFunction;
    this.dependentGlEntities.push(signedDistanceFunction);
  }
  getDistance(point: Vec3): number {
    return this.signedDistanceFunction.tsClosure( [new GlVec3(point)] ).value;
  }
  GlFunc_getDistance(): string{ return `
    float getDistance_${this.id}(vec3 point) {
      return ${this.signedDistanceFunction.glFuncName}(point);
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
  override getDistance(point: Vec3): number {
    let p_abs = point.map((v)=>Math.abs(v));
    let diff = p_abs.add(this.size.value.negative());
    let positive = diff.map((v)=>Math.max(v,0)).len();
    let negative = Math.min(0, Math.max(diff[0], diff[1], diff[2]));
    return positive + negative;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      vec3 p_abs = abs(point);
      vec3 diff = p_abs - size_${this.id};
      float positive = length(max(diff, 0.0));
      float negative = min(max(diff.x, max(diff.y, diff.z)), 0.0);
      return positive + negative;
    }`;
  }
}

export class Sphere extends Shape3D {
  override getDistance(point: Vec3): number {
    return point.len()-1;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return length(point) - 1.0;
    }`;
  }
}

export class Map extends FromSdfClosure {
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, mapper: TsGlClosure<GlFloat, [GlFloat]>) {
    let map = new tsgl_closure.Map(`getDistance`, original, mapper);
    super(map);
  }
}

export class Bloated extends Map {
  radius: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, radius: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(distance.value - this.radius.value),
      () => `{return v0 - radius_${this.id};}`
    );
    super(original, mapper);
    this.radius = new GlFloat(radius);
    this.glUniformVars.push({name:"radius", value:this.radius});
  }
}
export class Hollowed extends Map {
  thickness: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, thickness: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(Math.abs(distance.value) - this.thickness.value),
      () => `{return abs(v0) - thickness_${this.id};}`
    );
    super(original, mapper);
    this.thickness = new GlFloat(thickness);
    this.glUniformVars.push({name:"thickness", value:this.thickness});
  }
}


export class Reduce extends FromSdfClosure {
  constructor(reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]>, lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reduce = new tsgl_closure.Reduce(`getDistance`, reducer, lhs, rhs);
    super(reduce);
  }
}
export class Union extends Reduce {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.min(args[0].value, args[1].value) ),
      () => `{return min(v0, v1);}`
    );
    super(reducer, lhs, rhs);
  }
}
export class Subtraction extends Reduce {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, -args[1].value) ),
      () => `{return max(v0, -v1);}`
    );
    super(reducer, lhs, rhs);
  }
}
export class Intersection extends Reduce {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, args[1].value) ),
      () => `{return max(v0, v1);}`
    );
    super(reducer, lhs, rhs);
  }
}
export class SmoothUnion extends Reduce {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmin(args[0].value, args[1].value, this.smoothness.value) ),
      () => `{return smoothmin(v0, v1, smoothness_${this.id});}`
    );
    super(reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}
export class SmoothSubtraction extends Reduce {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmax(args[0].value, -args[1].value, this.smoothness.value) ),
      () => `{return smoothmax(v0, -v1, smoothness_${this.id});}`
    );
    super(reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}
export class SmoothIntersection extends Reduce {
  smoothness: GlFloat;
  constructor(lhs: TsGlClosure<GlFloat, [GlVec3]>, rhs: TsGlClosure<GlFloat, [GlVec3]>[], smoothness: number) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `reduce`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( smoothmax(args[0].value, args[1].value, this.smoothness.value) ),
      () => `{return smoothmax(v0, v1, smoothness_${this.id});}`
    );
    super(reducer, lhs, rhs);
    this.smoothness = new GlFloat(smoothness);
    this.glUniformVars.push({name:"smoothness", value:this.smoothness});
  }
}


export class Displacement extends FromSdfClosure {
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, displacer: TsGlClosure<GlVec3, [GlVec3]>) {
    let displacement = new tsgl_closure.Displacement(`getDistance`, original, displacer);
    super(displacement);
  }
}

export class Transformed extends Displacement {
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, transform: Transform) {
    super(original, new tsgl_closure.InverseTransform(transform));
  }
}
export class RepetitionInf extends Displacement {
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
    super(original, displacer);
    this.interval = new GlVec3(interval);
    this.glUniformVars.push({name:"interval", value:this.interval});
  }
}
export class RepetitionInfX extends Displacement {
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
    super(original, displacer);
    this.interval = new GlFloat(interval);
    this.glUniformVars.push({name:"interval", value:this.interval});
  }
}
export class Repetition extends Displacement {
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
    super(original, displacer);
    this.interval = new GlVec3(interval);
    this.max_indices = new GlVec3(max_indices);
    this.glUniformVars.push(
      {name: "interval", value: this.interval},
      {name: "max_indices", value: this.max_indices},
    );
  }
}


export class BoundingShape extends Shape3D {
  original: GlEntity & HasShape;
  bounding: GlEntity & HasShape;
  margin: GlFloat;
  constructor(original: GlEntity & HasShape, bounding: GlEntity & HasShape, margin: number) {
    super();
    this.margin = new GlFloat(margin);
    this.original = original;
    this.bounding = bounding;
    this.dependentGlEntities.push(original, bounding);
    this.glUniformVars.push({name:"margin", value:this.margin});
  }
  override getDistance(point: Vec3): number {
    let res = this.bounding.getDistance(point);
    if (res < this.margin.value) {
      res = this.original.getDistance(point);
    }
    return res;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      float res = getDistance_${this.bounding.id}(point);
      if (res < margin_${this.id}) {
        res = getDistance_${this.original.id}(point);
      }
      return res;
    }`;
  }
}


export class Extrude extends Shape3D {
  shape2d: TsGlClosure<GlFloat, [GlVec2]>;
  thickness: GlFloat;
  constructor(shape2d: TsGlClosure<GlFloat, [GlVec2]>, thickness: GlFloat) {
    super();
    this.shape2d = shape2d;
    this.thickness = thickness;
    this.dependentGlEntities.push(shape2d);
    this.glUniformVars.push({name: "thickness", value: this.thickness});
  }
  override getDistance(point: Vec3): number {
    let distance2d = this.shape2d.tsClosure([new GlVec2(new Vec2(point[0], point[1]))]).value;
    let distanceZ = Math.abs(point[2]) - this.thickness.value;
    let negative = Math.min(Math.max(distance2d, distanceZ), 0);
    let positive = (new Vec2(Math.max(distance2d,0), Math.max(distanceZ,0))).len();
    return negative + positive;
  }
  override GlFunc_getDistance(): string {return `
    float getDistance_${this.id} (vec3 point) {
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
  override getDistance(point: Vec3): number {
    let p = new Vec2( (new Vec2(point[0], point[2])).len(), point[1] );
    return this.shape2d.tsClosure([new GlVec2(p)]).value;
  }
  override GlFunc_getDistance(): string {return `
    float getDistance_${this.id} (vec3 point) {
      vec2 p = vec2(length(point.xz), point.y);
      return ${this.shape2d.glFuncName}(p);
    }
  `;}
}
