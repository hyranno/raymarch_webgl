import {Vec3} from './util';
import {GlEntity} from './gl_entity';

export abstract class Texture extends GlEntity {
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getTexturePatch()}
  `;}
  abstract GlFunc_getTexturePatch(): string;
}


export class ConstantTexture extends Texture {
  albedo: Vec3;
  roughness: number;
  specular: number;
  constructor(albedo: Vec3, roughness: number, specular: number) {
    super();
    this.albedo = albedo;
    this.roughness = roughness;
    this.specular = specular;
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        albedo_${this.id}, roughness_${this.id}, specular_${this.id},
        point, normal
      );
    }
  `;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 albedo_${this.id};
    uniform float roughness_${this.id};
    uniform float specular_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void{
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `albedo_${this.id}`, this.albedo);
    GlEntity.setGlUniformFloat(gl, program, `roughness_${this.id}`, this.roughness);
    GlEntity.setGlUniformFloat(gl, program, `specular_${this.id}`, this.specular);
  }
}
