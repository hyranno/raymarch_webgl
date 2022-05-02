import {Vec3D, Quaternion, smoothmax, smoothmin, clamp} from './util';
import {GlEntity, HasShape, Shape3D} from './gl_entity';


export class Transform3D extends Shape3D {
  original: GlEntity & HasShape;
  scale: number;
  rotation: Quaternion;
  translate: Vec3D;
  constructor(original: Shape3D, scale: number, rotation: Quaternion, translate: Vec3D) {
    super();
    this.original = original;
    this.scale = scale;
    this.rotation = rotation;
    this.translate = translate;
    this.dependentGlEntities.push(original);
  }
  GlFunc_getTransform(): string {
    return `Transform getTransform_${this.id} () {
      return Transform(translate_${this.id}, rotation_${this.id}, scale_${this.id});
    }`;
  }
  transform(p: Vec3D): Vec3D {
    var res: Vec3D = p.clone();
    return res.mul(this.scale).rotate(this.rotation).add(this.translate);
  }
  GlFunc_transform(): string {
    return `vec3 transform_${this.id} (vec3 p) {
      return coord_transform(getTransform_${this.id}(), p);
    }`;
  }
  inverse(p: Vec3D): Vec3D {
    var res: Vec3D = p.add(this.translate.negative()).rotate(this.rotation.inverse()).mul(1/this.scale);
    return res;
  }
  GlFunc_inverse(): string {
    return `vec3 inverse_${this.id} (vec3 p) {
      return coord_inverse(getTransform_${this.id}(), p);
    }`;
  }
  override getDistance(point: Vec3D): number {
    var p = this.inverse(point);
    var d = this.original.getDistance(p);
    return d * this.scale;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      float d = getDistance_${this.original.id}(inverse_${this.id}(point));
      return d * scale_${this.id};
    }`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float scale_${this.id};
    uniform vec4 rotation_${this.id};
    uniform vec3 translate_${this.id};
    Transform getTransform_${this.id} ();
    vec3 transform_${this.id} (vec3 p);
    vec3 inverse_${this.id} (vec3 p);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getTransform()}
    ${this.GlFunc_transform()}
    ${this.GlFunc_inverse()}
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void{
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `scale_${this.id}`, this.scale);
    GlEntity.setGlUniformFloat(gl, program, `rotation_${this.id}`,
      this.rotation.xyz.x, this.rotation.xyz.y, this.rotation.xyz.z, this.rotation.w
    );
    GlEntity.setGlUniformFloat(gl, program, `translate_${this.id}`,
      this.translate.x, this.translate.y, this.translate.z
    );
  }
}

export class Box extends Shape3D {
  size: Vec3D;
  constructor(size: Vec3D) {
    super();
    this.size = size;
  }
  override getDistance(point: Vec3D): number {
    var p_abs = new Vec3D(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
    var diff = p_abs.add(this.size.negative());
    var positive = (new Vec3D(Math.max(diff.x, 0), Math.max(diff.y, 0), Math.max(diff.z, 0))).len();
    var negative = Math.min(0, Math.max(diff.x, diff.y, diff.z));
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
    GlEntity.setGlUniformFloat(gl, program, `size_${this.id}`,
      this.size.x, this.size.y, this.size.z
    );
  }
}

export class Sphere extends Shape3D {
  override getDistance(point: Vec3D): number {
    return point.len()-1;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return length(point) - 1.0;
    }`;
  }
}

export class Bloated extends Shape3D {
  original: Shape3D;
  radius: number;
  constructor(original: Shape3D, radius: number) {
    super();
    this.original = original;
    this.radius = radius;
    this.dependentGlEntities.push(original);
  }
  override getDistance(point: Vec3D): number {
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
  original: Shape3D;
  thickness: number;
  constructor(original: Shape3D, thickness: number) {
    super();
    this.original = original;
    this.thickness = thickness;
    this.dependentGlEntities.push(original);
  }
  override getDistance(point: Vec3D): number {
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
  shape1: Shape3D;
  shape2: Shape3D;
  constructor(shape1: Shape3D, shape2: Shape3D) {
    super();
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.dependentGlEntities.push(shape1, shape2);
  }
}
export class Union extends BooleanOp {
  override getDistance(point: Vec3D): number {
    return Math.min( this.shape1.getDistance(point), this.shape2.getDistance(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return min( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point) );
    }`;
  }
}
export class Subtraction extends BooleanOp {
  override getDistance(point: Vec3D): number {
    return Math.max( this.shape1.getDistance(point), -this.shape2.getDistance(point) );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return max( getDistance_${this.shape1.id}(point), -getDistance_${this.shape2.id}(point) );
    }`;
  }
}
export class Intersection extends BooleanOp {
  override getDistance(point: Vec3D): number {
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
  constructor(shape1: Shape3D, shape2: Shape3D, smoothness: number) {
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
  override getDistance(point: Vec3D): number {
    return smoothmin( this.shape1.getDistance(point), this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmin( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}
export class SmoothSubtraction extends SmoothBooleanOp {
  override getDistance(point: Vec3D): number {
    return smoothmax( this.shape1.getDistance(point), -this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmax( getDistance_${this.shape1.id}(point), -getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}
export class SmoothIntersection extends SmoothBooleanOp {
  override getDistance(point: Vec3D): number {
    return smoothmax( this.shape1.getDistance(point), this.shape2.getDistance(point), this.smoothness );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return smoothmax( getDistance_${this.shape1.id}(point), getDistance_${this.shape2.id}(point), smoothness_${this.id} );
    }`;
  }
}


export abstract class Displacement extends Shape3D {
  original: Shape3D;
  constructor(original: Shape3D) {
    super();
    this.original = original;
    this.dependentGlEntities.push(original);
  }
  abstract displace(point: Vec3D) : Vec3D;
  abstract GLFunc_displace() : string;
  override getDistance(point: Vec3D): number {
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
  interval: Vec3D;
  constructor(original: Shape3D, interval: Vec3D) {
    super(original);
    this.interval = interval;
  }
  override displace(point: Vec3D): Vec3D {
    var origin = new Vec3D(
      this.interval.x * Math.round(point.x/this.interval.x),
      this.interval.y * Math.round(point.y/this.interval.y),
      this.interval.z * Math.round(point.z/this.interval.z),
    );
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
    GlEntity.setGlUniformFloat(gl, program, `interval_${this.id}`,
      this.interval.x, this.interval.y, this.interval.z
    );
  }
}

export class Repetition extends Displacement {
  interval: Vec3D;
  max_indices: Vec3D;
  constructor(original: Shape3D, interval: Vec3D, max_indices: Vec3D) {
    super(original);
    this.interval = interval;
    this.max_indices = max_indices;
  }
  override displace(point: Vec3D): Vec3D {
    var origin = new Vec3D(
      this.interval.x * clamp(Math.round(point.x/this.interval.x), -this.max_indices.x, this.max_indices.x),
      this.interval.y * clamp(Math.round(point.y/this.interval.y), -this.max_indices.y, this.max_indices.y),
      this.interval.z * clamp(Math.round(point.z/this.interval.z), -this.max_indices.z, this.max_indices.z),
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
    GlEntity.setGlUniformFloat(gl, program, `interval_${this.id}`,
      this.interval.x, this.interval.y, this.interval.z
    );
    GlEntity.setGlUniformFloat(gl, program, `max_indices_${this.id}`,
      this.max_indices.x, this.max_indices.y, this.max_indices.z
    );
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
  override getDistance(point: Vec3D): number {
    var res = this.bounding.getDistance(point);
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
