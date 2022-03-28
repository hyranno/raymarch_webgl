import {Vec3D} from './util';


export abstract class GlEntity {
  static nextId = 0;
  id: number;
  constructor() {
    this.id = GlEntity.nextId++;
  }
  abstract getGlVars(): string;
  abstract setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void;
  static setGlUniformFloat(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, ...values: number[]): void {
    var location: WebGLUniformLocation = gl.getUniformLocation(program, name);
    var f = [gl.uniform1fv, gl.uniform2fv, gl.uniform3fv, gl.uniform4fv, ];
    f[values.length-1].call(gl, location, values);
  }
}

export abstract class Material extends GlEntity {
  constructor() {
    super();
  }
  abstract GlFunc_getAmbient(): string; //(vec3 point, vec3 normal, vec3 ray, out vec3 color)
  abstract GlFunc_getDiffuse(): string; //(vec3 point, vec3 normal, Photon photon, vec3 ray, out vec3 color)
  abstract GlFunc_getSpecular(): string; //(vec3 point, vec3 normal, Photon photon, vec3 ray, out vec3 color)
}

export abstract class Shape3D extends GlEntity {
  constructor() {
    super();
  }
  abstract GlFunc_getDistance(): string; //(vec3 point, out float distance), SignedDistanceFunction
  abstract getDistance(point: Vec3D): number;
  getNormal(point: Vec3D): Vec3D {
    const EPS = 0.0001;
    var v: Vec3D = new Vec3D(
      this.getDistance(point.add(new Vec3D(+EPS,0,0))) - this.getDistance(point.add(new Vec3D(-EPS,0,0))),
      this.getDistance(point.add(new Vec3D(0,+EPS,0))) - this.getDistance(point.add(new Vec3D(0,-EPS,0))),
      this.getDistance(point.add(new Vec3D(0,0,+EPS))) - this.getDistance(point.add(new Vec3D(0,0,-EPS))),
    );
    return v.normalize();
  }
}

export class Drawable extends GlEntity {
  shape: Shape3D;
  material: Material;
  constructor(shape: Shape3D, material: Material) {
    super();
    this.shape = shape;
    this.material = material;
  }
  override getGlVars(): string {
    return this.shape.getGlVars() + this.material.getGlVars();
  }
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.shape.setGlVars(gl, program);
    this.material.setGlVars(gl, program);
  }
}

export abstract class Light extends GlEntity {
  abstract GlFunc_getPhotonTo(): string; //(vec3 point, out Photon photon)
  //abstract GlFunc_getPhoton(): string; //(out Photon photon), random photon
}

export class Camera extends GlEntity {
  resolution_x: number;
  resolution_y: number;
  position: Vec3D;
  upper_center: Vec3D;
  center_right: Vec3D;
  origin_distance: number;
  constructor(position: Vec3D, upper_center: Vec3D, center_right: Vec3D, origin_distance: number, resolution_x: number, resolution_y: number) {
    super();
    this.position = position;
    this.upper_center = upper_center;
    this.center_right = center_right;
    this.origin_distance = origin_distance;
    this.resolution_x = resolution_x;
    this.resolution_y = resolution_y;
  }
  override getGlVars(): string {return `
    uniform vec3 camera_position;
    uniform vec3 camera_upper_center;
    uniform vec3 camera_center_right;
    uniform float camera_origin_distance;
    uniform vec2 camera_resolution;
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    GlEntity.setGlUniformFloat(gl, program, `camera_position`,
      this.position.x, this.position.y, this.position.z
    );
    GlEntity.setGlUniformFloat(gl, program, `camera_upper_center`,
      this.upper_center.x, this.upper_center.y, this.upper_center.z
    );
    GlEntity.setGlUniformFloat(gl, program, `camera_center_right`,
      this.center_right.x, this.center_right.y, this.center_right.z
    );
    GlEntity.setGlUniformFloat(gl, program, `camera_origin_distance`, this.origin_distance);
    GlEntity.setGlUniformFloat(gl, program, `camera_resolution`,
      this.resolution_x, this.resolution_y
    );
  }
}
