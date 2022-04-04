import {Vec3D, Quaternion} from './util';
import * as shapes from '@tsgl/shapes';
import {Drawable} from '@tsgl/gl_entity';

export class Transform extends Drawable {
  transform_shape: shapes.Transform3D; //down-casted alias of shape
  constructor(original: Drawable, scale: number, rotation: Quaternion, translate: Vec3D){
    var transform = new shapes.Transform3D(original.shape, scale, rotation, translate);
    super(transform, original.material);
    this.transform_shape = transform;
  }
  override GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      Transform t = getTransform_${this.transform_shape.id}();
      return getAmbient_${this.material.id}(coord_inverse(t, point), coord_inverse(t, view));
    }`;
  }
  override GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, in Photon photon, in Ray view) {
      vec3 normal = getNormal_${this.id}(point);
      Transform t = getTransform_${this.transform_shape.id}();
      vec3 t_point = coord_inverse(t, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(t.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(t, photon.ray);
      Ray t_view = coord_inverse(t, view);
      return getDiffuse_${this.material.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
  override GlFunc_getSpecular(): string {
    return `vec3 getSpecular_${this.id} (vec3 point, in Photon photon, in Ray view) {
      vec3 normal = getNormal_${this.id}(point);
      Transform t = getTransform_${this.transform_shape.id}();
      vec3 t_point = coord_inverse(t, point);
      vec3 t_normal = quaternion_rot3(quaternion_inverse(t.rotation), normal);
      Photon t_photon = photon;
      t_photon.ray = coord_inverse(t, photon.ray);
      Ray t_view = coord_inverse(t, view);
      return getSpecular_${this.material.id}(t_point, t_normal, t_photon, t_view);
    }`;
  }
}

export class Group extends Drawable { //TODO: implement
  //has multiple Drawable
  //return values of which has the least distance
}
