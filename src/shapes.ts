import {Vec3D, Quaternion} from './util';
import {GlEntity, Shape3D} from './gl_entity';


export class Transform3D extends Shape3D {
  original: Shape3D;
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
  transform(p: Vec3D): Vec3D {
    var res: Vec3D = p.clone();
    return res.mul(this.scale).rotate(this.rotation).add(this.translate);
  }
  inverse(p: Vec3D): Vec3D {
    var res: Vec3D = p.add(this.translate.negative()).rotate(this.rotation.inverse()).mul(1/this.scale);
    return res;
  }
  override getDistance(point: Vec3D): number {
    var p = this.inverse(point);
    var d = this.original.getDistance(p);
    return d * this.scale;
  }
  override getNormal(point: Vec3D): Vec3D {
    var p = this.inverse(point);
    var v = this.original.getNormal(p);
    return v.rotate(this.rotation);
  }
  override GlFunc_getDistance(): string {
    var org = this.original.GlFunc_getDistance();
    var inv_p = `{
      point = point - translate_${this.id};
      point = quaternion_rot3(point, quaternion_inverse(rotation_${this.id}));
      point /= scale_${this.id};
    }`;
    var tran_d = `{
       obj_distance *= scale_${this.id};
    }`;
    return inv_p + org + tran_d;
  }
  override getGlVars(): string {
    return this.original.getGlVars() + `
      uniform float scale_${this.id};
      uniform vec4 rotation_${this.id};
      uniform vec3 translate_${this.id};
    `;
  }
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
    var diff = p_abs.add(this.size.mul(1/2).negative());
    var positive = (new Vec3D(Math.max(diff.x, 0), Math.max(diff.y, 0), Math.max(diff.z, 0))).len();
    var negative = Math.min(0, Math.max(diff.x, diff.y, diff.z));
    return positive + negative;
  }
  override GlFunc_getDistance(): string { return `{
      vec3 p_abs = abs(point);
      vec3 diff = p_abs - 0.5*size_${this.id};
      float positive = length(max(diff, 0.0));
      float negative = min(max(diff.x, diff.y, diff.z), 0.0);
      obj_distance = positive + negative;
  }`;}
  override getGlVars(): string { return `
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
    return `{
      obj_distance = length(point) - 1.0;
    }`;
  }
  override getGlVars(): string {return ``;}
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
    return this.original.GlFunc_getDistance() + `{
      obj_distance -= radius_${this.id};
    }`;
  }
  override getGlVars(): string {
    return this.original.getGlVars() + `
      uniform float radius_${this.id};
    `;
  }
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.original.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `radius_${this.id}`, this.radius);
  }
}
