import {Vec2, Vec3, Quaternion} from './util';
import {GlEntity} from './gl_entity';
import {GlFloat, GlVec2, GlVec3, GlQuaternion} from './gl_types';


export abstract class Camera extends GlEntity {
  position: GlVec3;
  rotation: GlQuaternion;
  screen_size: GlVec2;
  resolution: GlVec2;
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, resolution: Vec2) {
    super();
    this.position = new GlVec3(position);
    this.screen_size = new GlVec2(new Vec2(center_right.len(), upper_center.len()));
    this.rotation = new GlQuaternion( Quaternion.fromXY(center_right.normalize(), upper_center.normalize()) );
    this.resolution = new GlVec2(resolution);
    this.glUniformVars.push(
      {name:`position`, value: this.position},
      {name:`rotation`, value: this.rotation},
      {name:`screen_size`, value: this.screen_size},
      {name:`resolution`, value: this.resolution},
    );
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    void getRay_${this.id}(out Ray ray);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getRay()}
  `;}
  abstract GlFunc_getRay(): string;
}

export class Perspective extends Camera {
  origin_distance: GlFloat;
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, origin_distance: number, resolution: Vec2) {
    super(position, upper_center, center_right, resolution);
    this.origin_distance = new GlFloat(origin_distance);
    this.glUniformVars.push({name:"origin_distance", value:this.origin_distance});
  }
  override GlFunc_getRay(): string {return `
    void getRay_${this.id}(out Ray ray) {
      vec2 pixel = gl_FragCoord.xy;
      vec2 screen_pos = (pixel / resolution_${this.id} - vec2(0.5)) * screen_size_${this.id};
      vec3 rotated_pos = quaternion_rot3(rotation_${this.id}, vec3(screen_pos, 0));
      vec3 rotated_origin = quaternion_rot3(rotation_${this.id}, vec3(0,0,origin_distance_${this.id}));
      ray.start = position_${this.id} + rotated_pos;
      ray.direction = normalize(rotated_pos - rotated_origin);
    }
  `;}
}

export class Orthogonal extends Camera {
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, resolution: Vec2) {
    super(position, upper_center, center_right, resolution);
  }
  override GlFunc_getRay(): string {return `
    void getRay_${this.id}(out Ray ray) {
      vec2 pixel = gl_FragCoord.xy;
      vec2 screen_pos = (pixel / resolution_${this.id} - vec2(0.5)) * screen_size_${this.id};
      vec3 rotated_pos = quaternion_rot3(rotation_${this.id}, vec3(screen_pos, 0));
      ray.start = position_${this.id} + rotated_pos;
      ray.direction = quaternion_rot3(rotation_${this.id}, vec3(0,0,-1));
    }
  `;}
}
