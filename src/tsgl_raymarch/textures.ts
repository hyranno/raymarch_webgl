import {Vec3} from './util';
import {GlEntity} from './gl_entity';
import {GlFloat, GlVec3} from './gl_types';
import * as fields from './scalar_fields';
import * as v3fields from './vec3_fields';

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


export class Constant extends Texture {
  albedo: GlVec3;
  roughness: GlFloat;
  specular: GlFloat;
  constructor(albedo: Vec3, roughness: number, specular: number) {
    super();
    this.albedo = new GlVec3(albedo);
    this.roughness = new GlFloat(roughness);
    this.specular = new GlFloat(specular);
    this.glUniformVars.push(
      {name:"albedo", value:this.albedo},
      {name:"roughness", value:this.roughness},
      {name:"specular", value:this.specular},
    );
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        albedo_${this.id}, roughness_${this.id}, specular_${this.id},
        point, normal
      );
    }
  `;}
}


export abstract class Reduce extends Texture {
  lhs: Texture;
  rhs: Texture[];
  constructor(lhs: Texture, rhs: Texture[]) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
    this.dependentGlEntities.push(lhs);
    this.dependentGlEntities = this.dependentGlEntities.concat(rhs);
  }
}
export class Add extends Reduce {
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      TexturePatch res = getTexturePatch_${this.lhs.id}(point, normal);
      TexturePatch tmp;
      ${this.rhs.map((t)=>`
        tmp = getTexturePatch_${t.id}(point, normal);
        res = TexturePatch(
          res.albedo + tmp.albedo, res.roughness + tmp.roughness, res.specular + tmp.specular,
          point, normal
        );
      `).join("")}
      return res;
    }
  `;}
}
export class MulScalarField extends Texture {
  original: Texture;
  scale: fields.ScalarField;
  constructor(original: Texture, scale: fields.ScalarField) {
    super();
    this.original = original;
    this.scale = scale;
    this.dependentGlEntities.push(original, scale);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      TexturePatch res = getTexturePatch_${this.original.id}(point, normal);
      float scale = get_${this.scale.id}(point);
      return TexturePatch(
        res.albedo *scale, res.roughness *scale, res.specular *scale,
        point, normal
      );
    }
  `;}
}
export class Mean extends MulScalarField {
  constructor(lhs: Texture, rhs: Texture[]) {
    super(
      new Add(lhs, rhs),
      new fields.Constant(1/(rhs.length + 1))
    );
  }
}


export class FieldDefined extends Texture {
  albedo: v3fields.Vec3Field;
  roughness: fields.ScalarField;
  specular: fields.ScalarField;
  constructor(albedo: v3fields.Vec3Field, roughness: fields.ScalarField, specular: fields.ScalarField) {
    super();
    this.albedo = albedo;
    this.roughness = roughness;
    this.specular = specular;
    this.dependentGlEntities.push(albedo, roughness, specular);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        get_${this.albedo.id}(point),
        get_${this.roughness.id}(point), get_${this.specular.id}(point),
        point, normal
      );
    }
  `;}
}
