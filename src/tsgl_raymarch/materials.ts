import {GlEntity} from './gl_entity';
import {ReflectanceDistribution} from './reflectances';
import {TexturePatch, GlFloat, GlVec3, Transform} from '@tsgl/gl_types';
import {GlClosure} from './gl_closure';


export interface HasMaterial {
  GlFunc_getTexturePatch(): string; //TexturePatch getTexturePatch_${this.id} (vec3 point);
  GlFunc_calcAmbient(): string; //vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view);
  GlFunc_calcDiffuse(): string; //vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
  GlFunc_calcSpecular(): string; //vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
}
export abstract class Material extends GlEntity implements HasMaterial {
  constructor() {
    super();
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    TexturePatch getTexturePatch_${this.id} (vec3 point);
    vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view);
    vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
    vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getTexturePatch()}
    ${this.GlFunc_calcAmbient()}
    ${this.GlFunc_calcDiffuse()}
    ${this.GlFunc_calcSpecular()}
  `;}
  abstract GlFunc_getTexturePatch(): string;
  abstract GlFunc_calcAmbient(): string;
  abstract GlFunc_calcDiffuse(): string;
  abstract GlFunc_calcSpecular(): string;
}


export class TextureReflectanceModel extends Material {
  texture: GlClosure<TexturePatch, [GlVec3]>;
  reflectance: ReflectanceDistribution;
  constructor(texture: GlClosure<TexturePatch, [GlVec3]>, reflectance: ReflectanceDistribution) {
    super();
    this.texture = texture;
    this.reflectance = reflectance;
    this.dependentGlEntities.push(texture, reflectance);
  }
  override GlFunc_getTexturePatch(): string { return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      return ${this.texture.glFuncName}(point);
    }
  `;}
  override GlFunc_calcAmbient(): string { return `
    vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      return calcAmbient_${this.reflectance.id}(texture, intensity, view);
    }
  `;}
  override GlFunc_calcDiffuse(): string { return `
    vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcDiffuse_${this.reflectance.id}(texture, photon, view);
    }
  `;}
  override GlFunc_calcSpecular(): string { return `
    vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcSpecular_${this.reflectance.id}(texture, photon, view);
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
  override GlFunc_getTexturePatch(): string { return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      return getTexturePatch_${this.original.id}( coord_inverse(transform_${this.id}, point) );
    }
  `;}
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      TexturePatch t_texture = texture;
      t_texture.point = coord_inverse(transform_${this.id}, texture.point);
      t_texture.normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), texture.normal);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcAmbient_${this.original.id}(t_texture, intensity, t_view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch t_texture = texture;
      t_texture.point = coord_inverse(transform_${this.id}, texture.point);
      t_texture.normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), texture.normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(transform_${this.id}, photon.ray);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcDiffuse_${this.original.id}(t_texture, t_photon, t_view);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch t_texture = texture;
      t_texture.point = coord_inverse(transform_${this.id}, texture.point);
      t_texture.normal = quaternion_rot3(quaternion_inverse(transform_${this.id}.rotation), texture.normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(transform_${this.id}, photon.ray);
      Ray t_view = coord_inverse(transform_${this.id}, view);
      return calcSpecular_${this.original.id}(t_texture, t_photon, t_view);
    }`;
  }
}

export class NormalMap extends Material {
  original: Material;
  quantity: GlClosure<GlFloat, [GlVec3]>;
  axis: GlClosure<GlFloat, [GlVec3]>;
  constructor(original: Material, quantity: GlClosure<GlFloat, [GlVec3]>, axis: GlClosure<GlFloat, [GlVec3]>){
    super();
    this.original = original;
    this.quantity = quantity;
    this.axis = axis;
    this.dependentGlEntities.push(original, quantity, axis);
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 mapNormal_${this.id} (vec3 point, vec3 normal);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_mapNormal()}
  `;}
  override GlFunc_getTexturePatch(): string { return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      return getTexturePatch_${this.original.id}(point);
    }
  `;}
  GlFunc_mapNormal(): string {return `
    vec3 mapNormal_${this.id} (vec3 point, vec3 normal) {
      float angle = ${this.quantity.glFuncName}(point);
      vec3 axis = quaternion_rot3(
        quaternion_fromSrcDest(vec3(0,1,0), normal),
        quaternion_rot3(
          quaternion_fromAngleAxis(${this.axis.glFuncName}(point), vec3(0,1,0)),
          vec3(1,0,0)
        )
      );
      return quaternion_rot3(
        quaternion_fromAngleAxis(angle, axis),
        normal
      );
    }
  `;}
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcAmbient_${this.original.id}(m_texture, intensity, view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcDiffuse_${this.original.id}(m_texture, photon, view);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcSpecular_${this.original.id}(m_texture, photon, view);
    }`;
  }
}

export class BumpMap extends Material {
  original: Material;
  bump: GlClosure<GlFloat, [GlVec3]>;
  constructor(original: Material, bump: GlClosure<GlFloat, [GlVec3]>){
    super();
    this.original = original;
    this.bump = bump;
    this.dependentGlEntities.push(original, bump);
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    vec3 mapNormal_${this.id} (vec3 point, vec3 normal);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_mapNormal()}
  `;}
  override GlFunc_getTexturePatch(): string { return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      return getTexturePatch_${this.original.id}(point);
    }
  `;}
  GlFunc_mapNormal(): string {return `
    vec3 mapNormal_${this.id} (vec3 point, vec3 normal) {
      vec4 q = quaternion_fromSrcDest(vec3(0,0,1), normal);
      vec3 dx = quaternion_rot3(q, vec3(EPS,0,0));
      vec3 dy = quaternion_rot3(q, vec3(0,EPS,0));
      float dw_x = ${this.bump.glFuncName}(point+dx) - ${this.bump.glFuncName}(point-dx);
      float dw_y = ${this.bump.glFuncName}(point+dy) - ${this.bump.glFuncName}(point-dy);
      vec3 n = cross( vec3(EPS,0,dw_x), vec3(0,EPS,dw_y) );
      return quaternion_rot3(q, normalize(n));
    }
  `;}
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcAmbient_${this.original.id}(m_texture, intensity, view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcDiffuse_${this.original.id}(m_texture, photon, view);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      TexturePatch m_texture = texture;
      m_texture.normal = mapNormal_${this.id}(texture.point, texture.normal);
      return calcSpecular_${this.original.id}(m_texture, photon, view);
    }`;
  }
}
