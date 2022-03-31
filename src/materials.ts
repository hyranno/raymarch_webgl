import {Vec3D} from './util';
import {GlEntity, Material} from './gl_entity';

/*
Ambient: constant
Diffuse: Lambert
Specular: normalized Phong
*/
export class Phong extends Material {
  ambient: Vec3D;
  diffuse: Vec3D;
  metalness: number;
  specular: number;
  constructor(ambient: Vec3D, diffuse: Vec3D, metalness: number, specular: number) {
    super();
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.metalness = metalness;
    this.specular = specular;
  }
  override getGlDeclarations(): string {return `
    ${super.getGlDeclarations()}
    uniform vec3 ambient_${this.id};
    uniform vec3 diffuse_${this.id};
    uniform float metalness_${this.id};
    uniform float specular_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    GlEntity.setGlUniformFloat(gl, program, `ambient_${this.id}`,
      this.ambient.x, this.ambient.y, this.ambient.z
    );
    GlEntity.setGlUniformFloat(gl, program, `diffuse_${this.id}`,
      this.diffuse.x, this.diffuse.y, this.diffuse.z
    );
    GlEntity.setGlUniformFloat(gl, program, `metalness_${this.id}`, this.metalness);
    GlEntity.setGlUniformFloat(gl, program, `specular_${this.id}`, this.specular);
  }
  override GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      return ambient_${this.id};
    }`;
  }
  override GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      float cos_member = clamp( -dot(photon.ray.direction, normal), 0.0, 1.0 );
      vec3 f_rd = diffuse_${this.id};
      return (1.0-metalness_${this.id}) * f_rd * photon.color * cos_member;
    }`;
  }
  override GlFunc_getSpecular(): string {
    return `vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      float cos_member = clamp( dot(reflect(photon.ray.direction, normal), -view.direction), 0.0, 1.0 );
      float n = specular_${this.id};
      float f_rs = (n + 2.0) / radians(360.0) * pow(cos_member, n);
      return metalness_${this.id} * f_rs * photon.color;
    }`;
  }
}


/*
Diffuse: Oren-Nayar GGX Approximation
*/
