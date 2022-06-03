import {GlEntity} from './gl_entity';
import {ReflectanceDistribution} from './reflectances';
import {TexturePatch, GlVec3, Transform} from '@tsgl/gl_types';
import {GlClosure} from './gl_closure';


export interface HasMaterial {
  GlFunc_calcAmbient(): string; //vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view)
  GlFunc_calcDiffuse(): string; //vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
  GlFunc_calcSpecular(): string; //vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
}
export abstract class Material extends GlEntity implements HasMaterial {
  constructor() {
    super();
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view);
    vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
    vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
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


export class TextureReflectanceModel extends Material {
  texture: GlClosure<TexturePatch, [GlVec3, GlVec3]>;
  reflectance: ReflectanceDistribution;
  constructor(texture: GlClosure<TexturePatch, [GlVec3, GlVec3]>, reflectance: ReflectanceDistribution) {
    super();
    this.texture = texture;
    this.reflectance = reflectance;
    this.dependentGlEntities.push(texture, reflectance);
  }
  override GlFunc_calcAmbient(): string { return `
    vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view) {
      TexturePatch t = ${this.texture.glFuncName}(point, normal);
      return calcAmbient_${this.reflectance.id}(t, intensity, view);
    }
  `;}
  override GlFunc_calcDiffuse(): string { return `
    vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      TexturePatch t = ${this.texture.glFuncName}(point, normal);
      return calcDiffuse_${this.reflectance.id}(t, photon, view);
    }
  `;}
  override GlFunc_calcSpecular(): string { return `
    vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      TexturePatch t = ${this.texture.glFuncName}(point, normal);
      return calcSpecular_${this.reflectance.id}(t, photon, view);
    }
  `;}
}


export class Transformed extends Material {
  original: GlEntity & HasMaterial;
  transform: Transform;
  constructor(original: GlEntity & HasMaterial, transform: Transform) {
    super();
    this.original = original;
    this.transform = transform;
    this.glUniformVars.push({name:"transform", value:transform});
    this.dependentGlEntities.push(original);
  }
  GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view) {
      vec3 t_point = coord_inverse(transform_${this.id}, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), normal);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcAmbient_${this.original.id}(t_point, t_normal, intensity, t_view);
    }`;
  }
  GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 t_point = coord_inverse(transform_${this.id}, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(transform_${this.id}, photon.ray);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcDiffuse_${this.original.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
  GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 t_point = coord_inverse(transform_${this.id}, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(transform_${this.id}, photon.ray);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcSpecular_${this.original.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
}
