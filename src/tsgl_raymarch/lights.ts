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
    GlEntity.setGlUniformFloat(gl, program, `position_${this.id}`,
      this.position.x, this.position.y, this.position.z
    );
    GlEntity.setGlUniformFloat(gl, program, `color_${this.id}`,
      this.color.x, this.color.y, this.color.z
    );
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
    GlEntity.setGlUniformFloat(gl, program, `direction_${this.id}`,
      this.direction.x, this.direction.y, this.direction.z
    );
    GlEntity.setGlUniformFloat(gl, program, `color_${this.id}`,
      this.color.x, this.color.y, this.color.z
    );
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
