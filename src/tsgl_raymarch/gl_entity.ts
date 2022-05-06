import {Vec2, Vec3, Quaternion} from './util';


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

export interface HasMaterial {
  GlFunc_getAmbient(): string; //vec3 getAmbient_${this.id} (vec3 point, in Ray view)
  GlFunc_getDiffuse(): string; //vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
  GlFunc_getSpecular(): string; //vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
}
export abstract class Material extends GlEntity implements HasMaterial {
  constructor() {
    super();
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 getAmbient_${this.id} (vec3 point, in Ray view);
    vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
    vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getAmbient()}
    ${this.GlFunc_getDiffuse()}
    ${this.GlFunc_getSpecular()}
  `;}
  abstract GlFunc_getAmbient(): string;
  abstract GlFunc_getDiffuse(): string;
  abstract GlFunc_getSpecular(): string;
}

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


export abstract class Light extends GlEntity {
  abstract GlFunc_getPhotonTo(): string; //void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
  //abstract GlFunc_getPhoton(): string; //void light_getPhoton_(out Photon photon), random photon
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getPhotonTo()}
  `;}
}

export abstract class Camera extends GlEntity {
  position: Vec3;
  rotation: Quaternion;
  screen_size: Vec2;
  resolution: Vec2;
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, resolution: Vec2) {
    super();
    this.position = position;
    this.screen_size = new Vec2(center_right.len(), upper_center.len())
    this.rotation = Quaternion.fromXY(center_right.normalize(), upper_center.normalize());
    this.resolution = resolution;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 position_${this.id};
    uniform vec4 rotation_${this.id};
    uniform vec2 screen_size_${this.id};
    uniform vec2 resolution_${this.id};
    void getRay_${this.id}(out Ray ray);
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `position_${this.id}`, this.position);
    GlEntity.setGlUniformQuaternion(gl, program, `rotation_${this.id}`, this.rotation);
    GlEntity.setGlUniformFloat(gl, program, `screen_size_${this.id}`,
      this.screen_size[0], this.screen_size[1]
    );
    GlEntity.setGlUniformFloat(gl, program, `resolution_${this.id}`,
      this.resolution[0], this.resolution[1]
    );
  }
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getRay()}
  `;}
  abstract GlFunc_getRay(): string;
}

export abstract class Drawable extends GlEntity implements HasShape, HasMaterial {
  abstract GlFunc_getAmbient(): string;
  abstract GlFunc_getDiffuse(): string;
  abstract GlFunc_getSpecular(): string;
  abstract getDistance(point: Vec3): number;
  abstract GlFunc_getDistance(): string;
  abstract getNormal(point: Vec3): Vec3;
  abstract GlFunc_getNormal(): string;
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float getDistance_${this.id} (vec3 point);
    vec3 getNormal_${this.id} (vec3 point);
    vec3 getAmbient_${this.id} (vec3 point, in Ray view);
    vec3 getDiffuse_${this.id} (vec3 point, in Photon photon, in Ray view);
    vec3 getSpecular_${this.id} (vec3 point, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getDistance()}
    ${this.GlFunc_getNormal()}
    ${this.GlFunc_getAmbient()}
    ${this.GlFunc_getDiffuse()}
    ${this.GlFunc_getSpecular()}
  `;}
}
