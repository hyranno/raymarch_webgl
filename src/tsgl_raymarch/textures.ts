import {Vec3} from './util';
import {GlClosure} from './gl_closure';
import * as glClosure from './gl_closure';
import {GlFloat, GlVec3, TexturePatch} from './gl_types';
import * as fields from './scalar_fields';

export abstract class Texture extends GlClosure<TexturePatch, [GlVec3, GlVec3]> {
  constructor() {
    super("getTexturePatch", TexturePatch.default(), [GlVec3.default(), GlVec3.default()]);
  }
  override GlFunc_get(): string {
    return this.GlFunc_getTexturePatch();
  }
  abstract GlFunc_getTexturePatch(): string;
}


export class Constant extends glClosure.Constant<TexturePatch, [GlVec3,GlVec3]> {
  constructor(albedo: Vec3, roughness: number, specular: number) {
    super("getTexturePatch", new TexturePatch(albedo, roughness, specular), [GlVec3.default(), GlVec3.default()]);
  }
  override GlFunc_get(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        value_${this.id}.albedo,
        value_${this.id}.roughness, value_${this.id}.specular,
        point, normal
      );
    }
  `;}
}
export class Add extends glClosure.Reduce<TexturePatch, [GlVec3,GlVec3]> {
  constructor(lhs: GlClosure<TexturePatch, [GlVec3, GlVec3]>, rhs: GlClosure<TexturePatch, [GlVec3,GlVec3]>[]){
    super("getTexturePatch", new glClosure.Add("add", TexturePatch.default()), lhs, rhs);
  }
}
export class MulScalar extends glClosure.MulScalar<TexturePatch, [GlVec3,GlVec3]> {
  constructor(scale: number, v: GlClosure<TexturePatch, [GlVec3,GlVec3]>){
    super("getTexturePatch", scale, v);
  }
}

export class MulScalarField extends Texture {
  original: GlClosure<TexturePatch, [GlVec3, GlVec3]>;
  scale: GlClosure<GlFloat, [GlVec3]>;
  constructor(original: GlClosure<TexturePatch, [GlVec3, GlVec3]>, scale: GlClosure<GlFloat, [GlVec3]>) {
    super();
    this.original = original;
    this.scale = scale;
    this.dependentGlEntities.push(original, scale);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      TexturePatch res = ${this.original.glFuncName}(point, normal);
      float scale = ${this.scale.glFuncName}(point);
      return TexturePatch(
        res.albedo *scale, res.roughness *scale, res.specular *scale,
        point, normal
      );
    }
  `;}
}
export class Mean extends MulScalarField {
  constructor(lhs: GlClosure<TexturePatch, [GlVec3, GlVec3]>, rhs: GlClosure<TexturePatch, [GlVec3, GlVec3]>[]) {
    super(
      new Add(lhs, rhs),
      new fields.Constant(1/(rhs.length + 1))
    );
  }
}


export class FieldDefined extends Texture {
  albedo: GlClosure<GlVec3, [GlVec3]>;
  roughness: GlClosure<GlFloat, [GlVec3]>;
  specular: GlClosure<GlFloat, [GlVec3]>;
  constructor(albedo: GlClosure<GlVec3, [GlVec3]>, roughness: GlClosure<GlFloat, [GlVec3]>, specular: GlClosure<GlFloat, [GlVec3]>) {
    super();
    this.albedo = albedo;
    this.roughness = roughness;
    this.specular = specular;
    this.dependentGlEntities.push(albedo, roughness, specular);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        ${this.albedo.glFuncName}(point),
        ${this.roughness.glFuncName}(point), ${this.specular.glFuncName}(point),
        point, normal
      );
    }
  `;}
}
