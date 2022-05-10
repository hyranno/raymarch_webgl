import {Vec3, Quaternion} from './util';


export abstract class GlEntity {
  static nextId = 0;
  id: number;
  private isGlDeclaredState: boolean;
  private isGlImplementedState: boolean;
  dependentGlEntities: GlEntity[];
  constructor() {
    this.id = GlEntity.nextId++;
    this.isGlDeclaredState = false;
    this.isGlImplementedState = false;
    this.dependentGlEntities = [];
  }
  isGlDeclared(): boolean {
    return this.isGlDeclaredState;
  }
  isGlImplemented(): boolean {
    return this.isGlImplementedState;
  }
  clearGlSourceStates(): void {
    this.isGlDeclaredState = false;
    this.isGlImplementedState = false;
    this.dependentGlEntities.forEach((entity) => entity.clearGlSourceStates());
  }
  getGlDeclarations(): string {
    let res = this.isGlDeclared()? `` : this.dependentGlEntities.map((entity) => entity.getGlDeclarations()).join("");
    this.isGlDeclaredState = true;
    return res;
  }
  getGlImplements(): string {
    let res = this.isGlImplemented()? `` : this.dependentGlEntities.map((entity) => entity.getGlImplements()).join("");
    this.isGlImplementedState = true;
    return res;
  }
  setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.dependentGlEntities.forEach((entity) => entity.setGlVars(gl, program));
  }
  static setGlUniformFloat(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, ...values: number[]): void {
    let location: WebGLUniformLocation = gl.getUniformLocation(program, name);
    let f = [gl.uniform1fv, gl.uniform2fv, gl.uniform3fv, gl.uniform4fv, ];
    f[values.length-1].call(gl, location, values);
  }
  static setGlUniformVec3(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, v: Vec3): void {
    GlEntity.setGlUniformFloat(gl, program, name, v[0], v[1], v[2]);
  }
  static setGlUniformQuaternion(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, q: Quaternion): void {
    GlEntity.setGlUniformFloat(gl, program, name, q.xyz[0], q.xyz[1], q.xyz[2], q.w);
  }
}


export class Transform extends GlEntity {
  scale: number;
  rotation: Quaternion;
  translate: Vec3;
  constructor(scale: number, rotation: Quaternion, translate: Vec3) {
    super();
    this.scale = scale;
    this.rotation = rotation;
    this.translate = translate;
  }
  transform(p: Vec3): Vec3 {
    let res: Vec3 = p.clone();
    return res.mul(this.scale).rotate(this.rotation).add(this.translate);
  }
  GlFunc_transform(): string { return `
    vec3 transform_${this.id} (vec3 p) {
      return coord_transform(transformParams_${this.id}, p);
    }
    Ray transform_${this.id} (Ray r) {
      return coord_transform(transformParams_${this.id}, r);
    }
    `;
  }
  inverse(p: Vec3): Vec3 {
    let res: Vec3 = p.add(this.translate.negative()).rotate(this.rotation.inverse()).mul(1/this.scale);
    return res;
  }
  GlFunc_inverse(): string { return `
    vec3 inverse_${this.id} (vec3 p) {
      return coord_inverse(transformParams_${this.id}, p);
    }
    Ray inverse_${this.id} (Ray r) {
      return coord_inverse(transformParams_${this.id}, r);
    }
    `;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform Transform transformParams_${this.id};
    vec3 transform_${this.id} (vec3 p);
    Ray transform_${this.id} (in Ray r);
    vec3 inverse_${this.id} (vec3 p);
    Ray inverse_${this.id} (in Ray r);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_transform()}
    ${this.GlFunc_inverse()}
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void{
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `transformParams_${this.id}.scale`, this.scale);
    GlEntity.setGlUniformQuaternion(gl, program, `transformParams_${this.id}.rotation`, this.rotation);
    GlEntity.setGlUniformVec3(gl, program, `transformParams_${this.id}.translate`, this.translate);
  }
}
