import {HasGlType} from './gl_types';

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
