import {TsGlClosure} from './tsgl_closure';
import * as glType from './gl_types';
import * as util from './util';


export class Transform extends TsGlClosure<glType.GlVec3, [glType.GlVec3]> {
  transform: glType.Transform;
  constructor(transform: glType.Transform) {
    super("transform", glType.GlVec3.default(), [glType.GlVec3.default()]);
    this.transform = transform;
    this.glUniformVars.push({name:"transformParams", value:this.transform});
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return coord_transform(transformParams_${this.id}, v0);
    }
  `;}
  override tsClosure([point]: [glType.GlVec3]): glType.GlVec3 {
    return new glType.GlVec3(this.transform.transform(point.value));
  }
}
export class InverseTransform extends TsGlClosure<glType.GlVec3, [glType.GlVec3]> {
  transform: glType.Transform;
  constructor(transform: glType.Transform) {
    super("transform", glType.GlVec3.default(), [glType.GlVec3.default()]);
    this.transform = transform;
    this.glUniformVars.push({name:"transformParams", value:this.transform});
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return coord_inverse(transformParams_${this.id}, v0);
    }
  `;}
  override tsClosure([point]: [glType.GlVec3]): glType.GlVec3 {
    return new glType.GlVec3(this.transform.inverse(point.value));
  }
}


export class Affine2D extends TsGlClosure<glType.GlVec2, [glType.GlVec2]> {
  mat: glType.GlMat3;
  constructor(mat: glType.GlMat3) {
    super("affine2d", glType.GlVec2.default(), [glType.GlVec2.default()]);
    this.mat = mat;
    this.glUniformVars.push({name:"mat", value:this.mat});
  }
  static identity(): Affine2D {
    return new Affine2D(new glType.GlMat3( util.Mat3.identity() ));
  }
  override GlFunc_get(): string { return `vec2 ${this.glFuncName} (vec2 point) {
    vec3 p = vec3(point, 1);
    vec3 res = mat_${this.id} * p;
    return res.xy;
  }`;}
  override tsClosure([point]: [glType.GlVec2]): glType.GlVec2 {
    let p = new util.Vec3(point.value[0], point.value[1], 1);
    let res = this.mat.value.mul3x1(p);
    return new glType.GlVec2(new util.Vec2(res[0], res[1]));
  }
  map(v: Affine2D): Affine2D {
    return new Affine2D(new glType.GlMat3(this.mat.value.mul(v.mat.value)));
  }
  scale(x: number, y: number): Affine2D {
    let mat = util.Mat3.identity();
    [x,y].forEach((v,i) => {mat[i][i] = v;});
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
  translate(x: number, y: number): Affine2D {
    let mat = util.Mat3.identity();
    [x,y].forEach((v,i) => {mat[i][2] = v;});
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
  rotate(angle: number): Affine2D {
    let mat = util.Mat3.zero();
    mat[0][0] = Math.cos(angle); mat[0][1] = -Math.sin(angle);
    mat[1][0] = Math.sin(angle); mat[1][1] = Math.cos(angle);
    mat[2][2] = 1;
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
  inverse(): Affine2D {
    let dim = 2;
    let a = this.mat.value.skip(dim,dim);
    let b = util.Vec2.fromClosure((i:number) => this.mat.value[i][dim]);
    let ai = a.inverse();
    let aib = ai.mul2x1(b);
    let mat = util.Mat3.fromClosure((i,j) => (i < dim)? ((j < dim)? ai[i][j] : -aib[i]) : 0);
    mat[dim][dim] = 1;
    return new Affine2D(new glType.GlMat3(mat));
  }
}


export class Affine3D extends TsGlClosure<glType.GlVec3, [glType.GlVec3]> {
  mat: glType.GlMat4;
  constructor(mat: glType.GlMat4) {
    super("affine", glType.GlVec3.default(), [glType.GlVec3.default()]);
    this.mat = mat;
    this.glUniformVars.push({name:"mat", value:this.mat});
  }
  static identity(): Affine3D {
    return new Affine3D(new glType.GlMat4( util.Mat4.identity() ));
  }
  override GlFunc_get(): string { return `vec3 ${this.glFuncName} (vec3 point) {
    vec4 p = vec4(point, 1);
    vec4 res = mat_${this.id} * p;
    return res.xyz;
  }`;}
  override tsClosure([point]: [glType.GlVec3]): glType.GlVec3 {
    let p = new util.Vec4(point.value[0], point.value[1], point.value[2], 1);
    let res = this.mat.value.mul4x1(p);
    return new glType.GlVec3(new util.Vec3(res[0], res[1], res[2]));
  }
  map(v: Affine3D): Affine3D {
    return new Affine3D(new glType.GlMat4(this.mat.value.mul(v.mat.value)));
  }
  scale(x: number, y: number, z: number): Affine3D {
    let mat = util.Mat4.identity();
    [x,y,z].forEach((v,i) => {mat[i][i] = v;});
    return (new Affine3D(new glType.GlMat4(mat))).map(this);
  }
  translate(x: number, y: number, z: number): Affine3D {
    let mat = util.Mat4.identity();
    [x,y,z].forEach((v,i) => {mat[i][3] = v;});
    return (new Affine3D(new glType.GlMat4(mat))).map(this);
  }
  rotate(q: util.Quaternion): Affine3D {
    let dcm = q.toDCM();
    let mat = util.Mat4.fromClosure((i,j) => (i<3 && j<3)? dcm[i][j] : 0);
    mat[3][3] = 1;
    return (new Affine3D(new glType.GlMat4(mat))).map(this);
  }
  inverse(): Affine3D {
    let dim = 3;
    let a = this.mat.value.skip(dim,dim);
    let b = util.Vec3.fromClosure((i:number) => this.mat.value[i][dim]);
    let ai = a.inverse();
    let aib = ai.mul3x1(b);
    let mat = util.Mat4.fromClosure((i,j) => (i < dim)? ((j < dim)? ai[i][j] : -aib[i]) : 0);
    mat[dim][dim] = 1;
    return new Affine3D(new glType.GlMat4(mat));
  }
}
