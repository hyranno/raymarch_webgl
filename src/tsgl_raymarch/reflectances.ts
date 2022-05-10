import {GlEntity} from './gl_entity';

export abstract class ReflectanceDistribution extends GlEntity {
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 calcAmbient_${this.id}(in TexturePatch p, in vec3 intensity, in Ray view);
    vec3 calcDiffuse_${this.id}(in TexturePatch p, in Photon photon, in Ray view);
    vec3 calcSpecular_${this.id}(in TexturePatch p, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_calcAmbient()}
    ${this.GlFunc_calcDiffuse()}
    ${this.GlFunc_calcSpecular()}
  `;}
  abstract GlFunc_calcAmbient(): string;
  abstract GlFunc_calcDiffuse(): string;
  abstract GlFunc_calcSpecular(): string;
}


export class Phong extends ReflectanceDistribution {
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id}(in TexturePatch p, in vec3 intensity, in Ray view) {
      return calcAmbient_constant(p, intensity, view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id}(in TexturePatch p, in Photon photon, in Ray view) {
      return calcDiffuse_Phong(p, photon);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id}(in TexturePatch p, in Photon photon, in Ray view) {
      return calcSpecular_Phong(p, photon, view);
    }`;
  }
}
