import {Vec3, Quaternion} from './util';
import * as shapes from '@tsgl/shapes';
import * as glEntities from '@tsgl/gl_entity';

export class MaterializedShape extends glEntities.Drawable {
  shape: glEntities.Shape3D;
  material: glEntities.Material;
  constructor(shape: glEntities.Shape3D, material: glEntities.Material) {
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
  GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      return getAmbient_${this.material.id}(point, view);
    }`;
  }
  GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.id}(point);
      return getDiffuse_${this.material.id}(point, normal, photon, view);
    }`;
  }
  GlFunc_getSpecular(): string {
    return `vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.id}(point);
      return getSpecular_${this.material.id}(point, normal, photon, view);
    }`;
  }
}

export class Transform extends glEntities.Drawable {
  transform_shape: shapes.Transform3D;
  original: glEntities.Drawable;
  constructor(original: glEntities.Drawable, scale: number, rotation: Quaternion, translate: Vec3){
    super();
    this.original = original;
    this.transform_shape = new shapes.Transform3D(original, scale, rotation, translate);
    this.dependentGlEntities.push(this.transform_shape);
  }
  getDistance(point: Vec3): number {
    return this.transform_shape.getDistance(point);
  }
  GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return getDistance_${this.transform_shape.id}(point);
    }`;
  }
  getNormal(point: Vec3): Vec3 {
    return this.transform_shape.getNormal(point);
  }
  GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      return getNormal_${this.transform_shape.id}(point);
    }`;
  }
  GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      Transform t = getTransform_${this.transform_shape.id}();
      return getAmbient_${this.original.id}(coord_inverse(t, point), coord_inverse(t, view));
    }`;
  }
  GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.id}(point);
      Transform t = getTransform_${this.transform_shape.id}();
      vec3 t_point = coord_inverse(t, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(t.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(t, photon.ray);
      Ray t_view = coord_inverse(t, view);
      return getDiffuse_${this.original.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
  GlFunc_getSpecular(): string {
    return `vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      normal = getNormal_${this.id}(point);
      Transform t = getTransform_${this.transform_shape.id}();
      vec3 t_point = coord_inverse(t, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(t.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(t, photon.ray);
      Ray t_view = coord_inverse(t, view);
      return getSpecular_${this.original.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
}

export class Group extends glEntities.Drawable {
  contents: glEntities.Drawable[];
  constructor(contents: glEntities.Drawable[]) {
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
  findNearest(point: Vec3): glEntities.Drawable {
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
  override GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      vec3 res = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        if (nearest==${d.id}) {
          res = getAmbient_${d.id}(point, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
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
          res = getDiffuse_${d.id}(point, normal, photon, view);
        }
      `).join("")}
      return res;
    }`;
  }
  override GlFunc_getSpecular(): string {
    return `vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 res = vec3(0);
      normal = vec3(0);
      float obj_distance;
      int nearest = findNearest_${this.id}(point, obj_distance);
      ${this.contents.map((d) => `
        normal += getNormal_${d.id}(point) * mix(0.0,1.0, nearest==${d.id});
      `).join("")}
      ${this.contents.map((d) => `
        res += getSpecular_${d.id}(point, normal, photon, view) * mix(0.0,1.0, nearest==${d.id});
      `).join("")}
      return res;
    }`;
  }
}
