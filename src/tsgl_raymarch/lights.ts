import {Vec3D} from './util';
import {GlEntity, Light} from './gl_entity';


export class PointLight extends Light {
  position: Vec3D;
  color: Vec3D;
  constructor(position: Vec3D, color: Vec3D) {
    super();
    this.position = position;
    this.color = color;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 position_${this.id};
    uniform vec3 color_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `position_${this.id}`, this.position);
    GlEntity.setGlUniformVec3(gl, program, `color_${this.id}`, this.color);
  }
  GlFunc_getPhotonTo(): string {
    return `void light_getPhotonTo_${this.id} (vec3 point, out Photon photon) {
      photon.ray.start = position_${this.id};
      photon.ray.direction = normalize(point-position_${this.id});
      photon.color = color_${this.id};
    }`;
  }
}

export class DirectionalLight extends Light {
  direction: Vec3D;
  color: Vec3D;
  constructor(direction: Vec3D, color: Vec3D) {
    super();
    this.direction = direction;
    this.color = color;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 direction_${this.id};
    uniform vec3 color_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `direction_${this.id}`, this.direction);
    GlEntity.setGlUniformVec3(gl, program, `color_${this.id}`, this.color);
  }
  GlFunc_getPhotonTo(): string {
    return `void light_getPhotonTo_${this.id} (vec3 point, out Photon photon){
      const float d = MAX_DISTANCE * 0.8;
      photon.ray.start = point - d * direction_${this.id};
      photon.ray.direction = direction_${this.id};
      photon.color = color_${this.id};
    }`;
  }
}
