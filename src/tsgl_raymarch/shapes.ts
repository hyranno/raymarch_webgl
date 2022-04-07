import {Vec3D, Quaternion} from './util';
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
  override getGlDeclarations(): string { return `
    ${this.original.getGlDeclarations()}
    ${super.getGlDeclarations()}
    uniform float scale_${this.id};
    uniform vec4 rotation_${this.id};
    uniform vec3 translate_${this.id};
    Transform getTransform_${this.id} ();
    vec3 transform_${this.id} (vec3 p);
    vec3 inverse_${this.id} (vec3 p);
  `;}
  override getGlImplements(): string { return `
    ${this.original.getGlImplements()}
    ${super.getGlImplements()}
    ${this.GlFunc_getTransform()}
    ${this.GlFunc_transform()}
    ${this.GlFunc_inverse()}
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void{
    this.original.setGlVars(gl, program);
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
  override getGlDeclarations(): string {return `
    ${super.getGlDeclarations()}
    uniform vec3 size_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
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
  override getGlDeclarations(): string {return `
    ${super.getGlDeclarations()}
  `;}
  override setGlVars(): void {}
}

export class Bloated extends Shape3D {
  original: Shape3D;
  radius: number;
  constructor(original: Shape3D, radius: number) {
    super();
    this.original = original;
    this.radius = radius;
  }
  override getDistance(point: Vec3D): number {
    return this.original.getDistance(point) - this.radius;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.original.id}(point) - radius_${this.id};
    }`;
  }
  override getGlDeclarations(): string {return `
    ${this.original.getGlDeclarations()}
    ${super.getGlDeclarations()}
    uniform float radius_${this.id};
    float getDistance_${this.id} (vec3 point);
    vec3 getNormal_${this.id} (vec3 point);
  `;}
  override getGlImplements(): string { return `
    ${this.original.getGlImplements()}
    ${super.getGlImplements()}
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.original.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `radius_${this.id}`, this.radius);
  }
}
