import {Vec3, Quaternion} from './util';
import {HasGlType, GlFloat, GlVec3, GlQuaternion} from './gl_types';

export abstract class GlEntity {
  static nextId = 0;
  id: number;
  private isGlDeclaredState: boolean;
  private isGlImplementedState: boolean;
  dependentGlEntities: GlEntity[];
  glUniformVars: {name: string, value: HasGlType}[];
  constructor() {
    this.id = GlEntity.nextId++;
    this.isGlDeclaredState = false;
    this.isGlImplementedState = false;
    this.dependentGlEntities = [];
    this.glUniformVars = [];
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
    let res = "";
    if (!this.isGlDeclared()) {
      res += this.dependentGlEntities.map((entity) => entity.getGlDeclarations()).join("");
      res += this.glUniformVars.map((entry) => `uniform ${entry.value.getGlTypeString()} ${entry.name}_${this.id};`).join("");
    }
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
    this.glUniformVars.forEach((entry) => {entry.value.setGlUniform(gl,program, `${entry.name}_${this.id}` )});
  }
}


export class Transform extends GlEntity {
  scale: GlFloat;
  rotation: GlQuaternion;
  translate: GlVec3;
  constructor(scale: number, rotation: Quaternion, translate: Vec3) {
    super();
    this.scale = new GlFloat(scale);
    this.rotation = new GlQuaternion(rotation);
    this.translate = new GlVec3(translate);
    //DO NOT push to this.glUniformVars
  }
  transform(p: Vec3): Vec3 {
    let res: Vec3 = p.clone();
    return res.mul(this.scale.value).rotate(this.rotation).add(this.translate);
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
    let res: Vec3 = p.add(this.translate.negative()).rotate(this.rotation.inverse()).mul(1/this.scale.value);
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
    this.scale.setGlUniform(gl, program, `transformParams_${this.id}.scale`);
    this.rotation.setGlUniform(gl, program, `transformParams_${this.id}.rotation`);
    this.translate.setGlUniform(gl, program, `transformParams_${this.id}.translate`);
  }
}
