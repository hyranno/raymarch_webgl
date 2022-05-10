import {Vec3} from './util';
import * as shapes from '@tsgl/shapes';
import * as materials from '@tsgl/materials';
import * as glEntities from '@tsgl/gl_entity';

export abstract class Drawable extends glEntities.GlEntity implements shapes.HasShape, materials.HasMaterial {
  abstract GlFunc_calcAmbient(): string;
  abstract GlFunc_calcDiffuse(): string;
  abstract GlFunc_calcSpecular(): string;
  abstract getDistance(point: Vec3): number;
  abstract GlFunc_getDistance(): string;
  abstract getNormal(point: Vec3): Vec3;
  abstract GlFunc_getNormal(): string;
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float getDistance_${this.id} (vec3 point);
    vec3 getNormal_${this.id} (vec3 point);
    vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view);
    vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
    vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getDistance()}
    ${this.GlFunc_getNormal()}
    ${this.GlFunc_calcAmbient()}
    ${this.GlFunc_calcDiffuse()}
    ${this.GlFunc_calcSpecular()}
  `;}
}


export class MaterializedShape extends Drawable {
  shape: glEntities.GlEntity & shapes.HasShape;
  material: glEntities.GlEntity & materials.HasMaterial;
  constructor(shape: glEntities.GlEntity & shapes.HasShape, material: glEntities.GlEntity & materials.HasMaterial) {
    super();
    this.shape = shape;
    this.material = material;
    this.dependentGlEntities.push(shape, material);
  }
  getDistance(point: Vec3): number {
    return this.shape.getDistance(point);
  }
  getNormal(point: Vec3): Vec3 {
    return this.shape.getNormal(point);
  }
  GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.shape.id}(point);
    }`;
  }
  GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      return getNormal_${this.shape.id}(point);
    }`;
  }
  GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view) {
      normal = getNormal_${this.shape.id}(point);
      return calcAmbient_${this.material.id}(point, normal, intensity, view);
    }`;
  }
  GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.shape.id}(point);
      return calcDiffuse_${this.material.id}(point, normal, photon, view);
    }`;
  }
  GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.shape.id}(point);
      return calcSpecular_${this.material.id}(point, normal, photon, view);
    }`;
  }
}

export class Transformed extends MaterializedShape {
  constructor(original: Drawable, transform: glEntities.Transform){
    super(
      new shapes.Transformed(original, transform),
      new materials.Transformed(original, transform)
    );
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
        prev_id = mix(prev_id, ${d.id}, cond);
        prev_distance = mix(prev_distance, current_distance, cond);
      }`).join("")}
      obj_distance = prev_distance;
      return prev_id;
    }`;
  }
  getDistance(point: Vec3): number {
    return this.findNearest(point).getDistance(point);
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      float res;
      findNearest_${this.id}(point, res);
      return res;
    }`;
  }
  getNormal(point: Vec3): Vec3 {
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
  override GlFunc_calcAmbient(): string {
    return `vec3 calcAmbient_${this.id} (vec3 point, vec3 normal, in vec3 intensity, in Ray view) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = calcAmbient_${d.id}(point, normal, intensity, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_calcDiffuse(): string {
    return `vec3 calcDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 res = vec3(0);
      normal = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          normal = getNormal_${d.id}(point);
        }
      `).join("")}
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = calcDiffuse_${d.id}(point, normal, photon, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_calcSpecular(): string {
    return `vec3 calcSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 res = vec3(0);
      normal = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        normal += getNormal_${d.id}(point) * mix(0.0,1.0, nearest==${d.id});
      `).join("")}
      ${this.contents.map((d) => `
        res += calcSpecular_${d.id}(point, normal, photon, view) * mix(0.0,1.0, nearest==${d.id});
      `).join("")}
      return res;
    }`;
  }
}
