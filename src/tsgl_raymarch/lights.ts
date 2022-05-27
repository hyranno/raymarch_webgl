import {Vec3} from './util';
import {GlEntity} from './gl_entity';
import {GlVec3} from './gl_types';


export abstract class Light extends GlEntity {
  abstract GlFunc_getPhotonTo(): string; //void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
  //abstract GlFunc_getPhoton(): string; //void light_getPhoton_(out Photon photon), random photon
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getPhotonTo()}
  `;}
}

export class PointLight extends Light {
  position: GlVec3;
  color: GlVec3;
  constructor(position: Vec3, color: Vec3) {
    super();
    this.position = new GlVec3(position);
    this.color = new GlVec3(color);
    this.glUniformVars.push(
      {name: "position", value: this.position},
      {name: "color", value: this.color},
    );
  }
  GlFunc_getPhotonTo(): string {
    return `void light_getPhotonTo_${this.id} (vec3 point, out Photon photon) {
      photon.ray.start = position_${this.id};
      photon.ray.direction = normalize(point-position_${this.id});
      photon.color = color_${this.id};
    }`;
  }
}

export class DirectionalLight extends Light {
  direction: GlVec3;
  color: GlVec3;
  constructor(direction: Vec3, color: Vec3) {
    super();
    this.direction = new GlVec3(direction);
    this.color = new GlVec3(color);
    this.glUniformVars.push(
      {name: "direction", value: this.direction},
      {name: "color", value: this.color},
    );
  }
  GlFunc_getPhotonTo(): string {
    return `void light_getPhotonTo_${this.id} (vec3 point, out Photon photon){
      const float d = MAX_DISTANCE * 0.8;
      photon.ray.start = point - d * direction_${this.id};
      photon.ray.direction = direction_${this.id};
      photon.color = color_${this.id};
    }`;
  }
}
