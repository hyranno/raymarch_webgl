import {Vec2, Vec3, Quaternion} from './util';
import {GlEntity} from './gl_entity';


export abstract class Camera extends GlEntity {
  position: Vec3;
  rotation: Quaternion;
  screen_size: Vec2;
  resolution: Vec2;
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, resolution: Vec2) {
    super();
    this.position = position;
    this.screen_size = new Vec2(center_right.len(), upper_center.len())
    this.rotation = Quaternion.fromXY(center_right.normalize(), upper_center.normalize());
    this.resolution = resolution;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform vec3 position_${this.id};
    uniform vec4 rotation_${this.id};
    uniform vec2 screen_size_${this.id};
    uniform vec2 resolution_${this.id};
    void getRay_${this.id}(out Ray ray);
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformVec3(gl, program, `position_${this.id}`, this.position);
    GlEntity.setGlUniformQuaternion(gl, program, `rotation_${this.id}`, this.rotation);
    GlEntity.setGlUniformFloat(gl, program, `screen_size_${this.id}`,
      this.screen_size[0], this.screen_size[1]
    );
    GlEntity.setGlUniformFloat(gl, program, `resolution_${this.id}`,
      this.resolution[0], this.resolution[1]
    );
  }
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getRay()}
  `;}
  abstract GlFunc_getRay(): string;
}

export class Perspective extends Camera {
  origin_distance: number;
  constructor(position: Vec3, upper_center: Vec3, center_right: Vec3, origin_distance: number, resolution: Vec2) {
    super(position, upper_center, center_right, resolution);
    this.origin_distance = origin_distance;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float origin_distance_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `origin_distance_${this.id}`, this.origin_distance);
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
  origin_distance: number;
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
