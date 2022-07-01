import {Vec3} from '@tsgl/util';
import * as shapes from '@tsgl/shapes';
import * as materials from '@tsgl/materials';
import * as glEntities from '@tsgl/gl_entity';
import {GlFloat, GlVec3, Transform} from '@tsgl/gl_types';
import {GlClosure} from '@tsgl/gl_closure';
import {TsGlClosure} from './tsgl_closure';


export abstract class Drawable extends glEntities.GlEntity implements materials.HasMaterial {
  abstract GlFunc_getTexturePatch(): string;
  abstract GlFunc_mapNormal(): string;
  abstract GlFunc_calcAmbient(): string;
  abstract GlFunc_calcDiffuse(): string;
  abstract GlFunc_calcSpecular(): string;
  abstract getDistance(point: Vec3): number;
  abstract GlFunc_getDistance(): string;
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
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float getDistance_${this.id} (vec3 point);
    vec3 getNormal_${this.id} (vec3 point);
    TexturePatch getTexturePatch_${this.id} (vec3 point);
    vec3 mapNormal_${this.id} (vec3 point, vec3 normal);
    vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view);
    vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
    vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getDistance()}
    ${this.GlFunc_getNormal()}
    ${this.GlFunc_getTexturePatch()}
    ${this.GlFunc_mapNormal()}
    ${this.GlFunc_calcAmbient()}
    ${this.GlFunc_calcDiffuse()}
    ${this.GlFunc_calcSpecular()}
  `;}
}


export class MaterializedShape extends Drawable {
  shape: TsGlClosure<GlFloat, [GlVec3]>;
  material: glEntities.GlEntity & materials.HasMaterial;
  constructor(shape: TsGlClosure<GlFloat, [GlVec3]>, material: glEntities.GlEntity & materials.HasMaterial) {
    super();
    this.shape = shape;
    this.material = material;
    this.dependentGlEntities.push(shape, material);
  }
  override getDistance(point: Vec3): number {
    return this.shape.tsClosure([new GlVec3(point)]).value;
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return ${this.shape.glFuncName}(point);
    }`;
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      TexturePatch res = getTexturePatch_${this.material.id}(point);
      res.point = point;
      res.normal = mapNormal_${this.material.id}(point, getNormal_${this.id}(point));
      return res;
    }
  `;}
  override GlFunc_mapNormal(): string {
    return `vec3 mapNormal_${this.id} (vec3 point, vec3 normal) {
      return mapNormal_${this.material.id}(point, normal);
    }`;
  }
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      return calcAmbient_${this.material.id}(texture, intensity, view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcDiffuse_${this.material.id}(texture, photon, view);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcSpecular_${this.material.id}(texture, photon, view);
    }`;
  }
}

export class Transformed extends MaterializedShape {
  constructor(original: Drawable, transform: Transform){
    super(
      new shapes.Transformed(new shapes.Shape3DWrapper(original), transform),
      new materials.Transformed(original, transform)
    );
  }
}

export abstract class Delegation extends Drawable {
  original: Drawable;
  constructor(original: Drawable) {
    super();
    this.original = original;
    this.dependentGlEntities.push(original);
  }
  override getDistance(point: Vec3): number {
    return this.original.getDistance(point);
  }
  override getNormal(point: Vec3): Vec3 {
    return this.original.getNormal(point);
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.original.id}(point);
    }`;
  }
  override GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      return getNormal_${this.original.id}(point);
    }`;
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id} (vec3 point) {
      return getTexturePatch_${this.original.id}(point);
    }
  `;}
  override GlFunc_mapNormal(): string {
    return `vec3 mapNormal_${this.id} (vec3 point, vec3 normal) {
      return mapNormal_${this.original.id}(point, normal);
    }`;
  }
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      return calcAmbient_${this.original.id}(texture, intensity, view);
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcDiffuse_${this.original.id}(texture, photon, view);
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      return calcSpecular_${this.original.id}(texture, photon, view);
    }`;
  }
}

export class Group extends Drawable {
  contents: Drawable[];
  constructor(contents: Drawable[]) {
    super();
    this.contents = contents;
    contents.forEach((d) => this.dependentGlEntities.push(d));
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    int findNearest_${this.id} (vec3 point, out float obj_distance);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_findNearest()}
  `;}
  findNearest(point: Vec3): Drawable {
    return this.contents.reduce((prev, current) =>
      (prev.getDistance(point) < current.getDistance(point)) ? prev : current
    );
  }
  GlFunc_findNearest(): string {
    return `int findNearest_${this.id}(vec3 point, out float obj_distance) {
      int prev_id = -1;
      float prev_distance = MAX_DISTANCE;
      ${this.contents.map((d)=>`{
        float current_distance = getDistance_${d.id}(point);
        bool cond = abs(current_distance) < abs(prev_distance);
        prev_id = select(prev_id, ${d.id}, cond);
        prev_distance = select(prev_distance, current_distance, cond);
      }`).join("")}
      obj_distance = prev_distance;
      return prev_id;
    }`;
  }
  override getDistance(point: Vec3): number {
    return this.findNearest(point).getDistance(point);
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      float res;
      findNearest_${this.id}(point, res);
      return res;
    }`;
  }
  override getNormal(point: Vec3): Vec3 {
    return this.findNearest(point).getNormal(point);
  }
  override GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = getNormal_${d.id}(point);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_getTexturePatch(): string {
    return `TexturePatch getTexturePatch_${this.id} (vec3 point) {
      TexturePatch res;
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = getTexturePatch_${d.id}(point);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_mapNormal(): string {
    return `vec3 mapNormal_${this.id} (vec3 point, vec3 normal) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = mapNormal_${d.id}(point, normal);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (in TexturePatch texture, in vec3 intensity, in Ray view) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(texture.point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = calcAmbient_${d.id}(texture, intensity, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(texture.point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = calcDiffuse_${d.id}(texture, photon, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (in TexturePatch texture, in Photon photon, in Ray view) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(texture.point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = calcSpecular_${d.id}(texture, photon, view);
        }
      `).join("")}
      return res;
    }`;
  }
}
