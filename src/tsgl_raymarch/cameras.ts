import {Vec2D, Vec3D} from './util';
import {GlEntity, Camera} from './gl_entity';

export class Perspective extends Camera {
  origin_distance: number;
  constructor(position: Vec3D, upper_center: Vec3D, center_right: Vec3D, origin_distance: number, resolution: Vec2D) {
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
  constructor(position: Vec3D, upper_center: Vec3D, center_right: Vec3D, resolution: Vec2D) {
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
