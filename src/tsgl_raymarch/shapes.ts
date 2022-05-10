import {Vec3, smoothmax, smoothmin, clamp} from './util';
import {GlEntity, Transform} from './gl_entity';

export interface HasShape {
  getDistance(point: Vec3): number;
  GlFunc_getDistance(): string; //float getDistance_${this.id} (vec3 point);
  getNormal(point: Vec3): Vec3;
  GlFunc_getNormal(): string;
}
export abstract class Shape3D extends GlEntity implements HasShape {
  constructor() {
    super();
  }
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
  abstract getDistance(point: Vec3): number;
  abstract GlFunc_getDistance(): string; //float getDistance_${this.id} (vec3 point);
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
}

export class Transformed extends Shape3D {
  original: GlEntity & HasShape;
  transform: Transform;
  constructor(original: GlEntity & HasShape, transform: Transform) {
    super();
    this.original = original;
    this.transform = transform;
    this.dependentGlEntities.push(original, transform);
  }
  override getDistance(point: Vec3): number {
    let p = this.transform.inverse(point);
    let d = this.original.getDistance(p);
    return d * this.transform.scale;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      float d = getDistance_${this.original.id}( inverse_${this.transform.id}(point) );
      return d * transformParams_${this.transform.id}.scale;
    }`;
  }
}

export class Box extends Shape3D {
  size: Vec3;
  constructor(size: Vec3) {
    super();
    this.size = size;
  }
  override getDistance(point: Vec3): number {
    let p_abs = point.map((v)=>Math.abs(v));
    let diff = p_abs.add(this.size.negative());
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
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 size_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `size_${this.id}`, this.size);
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

export class Bloated extends Shape3D {
  original: GlEntity & HasShape;
  radius: number;
  constructor(original: GlEntity & HasShape, radius: number) {
    super();
    this.original = original;
    this.radius = radius;
    this.dependentGlEntities.push(original);
  }
  override getDistance(point: Vec3): number {
    return this.original.getDistance(point) - this.radius;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.original.id}(point) - radius_${this.id};
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float radius_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `radius_${this.id}`, this.radius);
  }
}

export class Hollowed extends Shape3D {
  original: GlEntity & HasShape;
  thickness: number;
  constructor(original: GlEntity & HasShape, thickness: number) {
    super();
    this.original = original;
    this.thickness = thickness;
    this.dependentGlEntities.push(original);
  }
  override getDistance(point: Vec3): number {
    return Math.abs(this.original.getDistance(point)) - this.thickness;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return abs(getDistance_${this.original.id}(point)) - thickness_${this.id};
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float thickness_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `thickness_${this.id}`, this.thickness);
  }
}

export abstract class BooleanOp extends Shape3D {
  shape1: GlEntity & HasShape;
  shape2: GlEntity & HasShape;
  constructor(shape1: GlEntity & HasShape, shape2: GlEntity & HasShape) {
    super();
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.dependentGlEntities.push(shape1, shape2);
  }
}
export class Union extends BooleanOp {
  override getDistance(point: Vec3): number {
    return Math.min( this.shape1.getDistance(point), this.shape2.getDistance(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return min( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point) );
    }`;
  }
}
export class Subtraction extends BooleanOp {
  override getDistance(point: Vec3): number {
    return Math.max( this.shape1.getDistance(point), -this.shape2.getDistance(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return max( getDistance_${this.shape1.id}(point), -getDistance_${this.shape2.id}(point) );
    }`;
  }
}
export class Intersection extends BooleanOp {
  override getDistance(point: Vec3): number {
    return Math.max( this.shape1.getDistance(point), this.shape2.getDistance(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return max( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point) );
    }`;
  }
}

export abstract class SmoothBooleanOp extends BooleanOp {
  smoothness: number;
  constructor(shape1: GlEntity & HasShape, shape2: GlEntity & HasShape, smoothness: number) {
    super(shape1, shape2);
    this.smoothness = smoothness;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float smoothness_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `smoothness_${this.id}`, this.smoothness);
  }
}
export class SmoothUnion extends SmoothBooleanOp {
  override getDistance(point: Vec3): number {
    return smoothmin( this.shape1.getDistance(point), this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmin( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}
export class SmoothSubtraction extends SmoothBooleanOp {
  override getDistance(point: Vec3): number {
    return smoothmax( this.shape1.getDistance(point), -this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmax( getDistance_${this.shape1.id}(point), -getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}
export class SmoothIntersection extends SmoothBooleanOp {
  override getDistance(point: Vec3): number {
    return smoothmax( this.shape1.getDistance(point), this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmax( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}


export abstract class Displacement extends Shape3D {
  original: GlEntity & HasShape;
  constructor(original: GlEntity & HasShape) {
    super();
    this.original = original;
    this.dependentGlEntities.push(original);
  }
  abstract displace(point: Vec3) : Vec3;
  abstract GLFunc_displace() : string;
  override getDistance(point: Vec3): number {
    return this.original.getDistance( this.displace(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.original.id}( displace_${this.id}(point) );
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 displace_${this.id}(vec3 point);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GLFunc_displace()}
  `;}
}

export class RepetitionInf extends Displacement {
  interval: Vec3;
  constructor(original: GlEntity & HasShape, interval: Vec3) {
    super(original);
    this.interval = interval;
  }
  override displace(point: Vec3): Vec3 {
    let origin = Vec3.fromClosure((i) => this.interval[i] * Math.round(point[i]/this.interval[i]));
    return point.add(origin.negative());
  }
  override GLFunc_displace() : string {
    return `vec3 displace_${this.id} (vec3 point) {
      vec3 origin = interval_${this.id} * round(point / interval_${this.id});
      return point - origin;
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 interval_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `interval_${this.id}`, this.interval);
  }
}

export class Repetition extends Displacement {
  interval: Vec3;
  max_indices: Vec3;
  constructor(original: GlEntity & HasShape, interval: Vec3, max_indices: Vec3) {
    super(original);
    this.interval = interval;
    this.max_indices = max_indices;
  }
  override displace(point: Vec3): Vec3 {
    let origin = Vec3.fromClosure((i) =>
      this.interval[i] * clamp(Math.round(point[i]/this.interval[i]), -this.max_indices[i], this.max_indices[i])
    );
    return point.add(origin.negative());
  }
  override GLFunc_displace() : string {
    return `vec3 displace_${this.id} (vec3 point) {
      vec3 origin = interval_${this.id} * clamp(round(point / interval_${this.id}), -max_indices_${this.id}, max_indices_${this.id});
      return point - origin;
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 interval_${this.id};
    uniform vec3 max_indices_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `interval_${this.id}`, this.interval);
    GlEntity.setGlUniformVec3(gl, program, `max_indices_${this.id}`, this.max_indices);
  }
}


export class BoundingShape extends Shape3D {
  original: GlEntity & HasShape;
  bounding: GlEntity & HasShape;
  margin: number;
  constructor(original: GlEntity & HasShape, bounding: GlEntity & HasShape, margin: number) {
    super();
    this.margin = margin;
    this.original = original;
    this.bounding = bounding;
    this.dependentGlEntities.push(original, bounding);
  }
  override getDistance(point: Vec3): number {
    let res = this.bounding.getDistance(point);
    if (res < this.margin) {
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
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float margin_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `margin_${this.id}`, this.margin);
  }
}
