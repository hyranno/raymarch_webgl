import {Vec2D, Vec3D, Quaternion} from './util';


export abstract class GlEntity {
  static nextId = 0;
  id: number;
  constructor() {
    this.id = GlEntity.nextId++;
  }
  abstract getGlDeclarations(): string;
  abstract getGlImplements(): string;
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
  override getGlDeclarations(): string {
    return `
      vec3 getAmbient_${this.id} (vec3 point, in Ray view);
      vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
      vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
    `;
  }
  override getGlImplements(): string {
    return `
      ${this.GlFunc_getAmbient()}
      ${this.GlFunc_getDiffuse()}
      ${this.GlFunc_getSpecular()}
    `;
  }
  abstract GlFunc_getAmbient(): string; //vec3 getAmbient_${this.id} (vec3 point, in Ray view)
  abstract GlFunc_getDiffuse(): string; //vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
  abstract GlFunc_getSpecular(): string; //vec3 getSpecular_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view);
}

export abstract class Shape3D extends GlEntity {
  constructor() {
    super();
  }
  override getGlDeclarations(): string {
    return `
      float getDistance_${this.id} (vec3 point);
      vec3 getNormal_${this.id} (vec3 point);
    `;
  }
  override getGlImplements(): string {
    return `
      ${this.GlFunc_getDistance()}
      ${this.GlFunc_getNormal()}
    `;
  }
  abstract GlFunc_getDistance(): string; //float getDistance_${this.id} (vec3 point);
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
  GlFunc_getNormal(): string {
    return `vec3 getNormal_${this.id} (vec3 point) {
      return normalize(vec3(
        getDistance_${this.id}(point+vec3(+EPS,0,0)) - getDistance_${this.id}(point+vec3(-EPS,0,0)),
        getDistance_${this.id}(point+vec3(0,+EPS,0)) - getDistance_${this.id}(point+vec3(0,-EPS,0)),
        getDistance_${this.id}(point+vec3(0,0,+EPS)) - getDistance_${this.id}(point+vec3(0,0,-EPS))
      ));
    }`;
  }
}


export abstract class Light extends GlEntity {
  abstract GlFunc_getPhotonTo(): string; //void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
  //abstract GlFunc_getPhoton(): string; //void light_getPhoton_(out Photon photon), random photon
  override getGlDeclarations(): string {
    return `
      void light_getPhotonTo_${this.id} (vec3 point, out Photon photon);
    `;
  }
  override getGlImplements(): string {
    return this.GlFunc_getPhotonTo();
  }
}

export abstract class Camera extends GlEntity {
  position: Vec3D;
  rotation: Quaternion;
  screen_size: Vec2D;
  resolution: Vec2D;
  constructor(position: Vec3D, upper_center: Vec3D, center_right: Vec3D, resolution: Vec2D) {
    super();
    this.position = position;
    this.screen_size = new Vec2D(center_right.len(), upper_center.len())
    this.rotation = Quaternion.fromXY(center_right.normalize(), upper_center.normalize());
    this.resolution = resolution;
  }
  override getGlDeclarations(): string {return `
    uniform vec3 position_${this.id};
    uniform vec4 rotation_${this.id};
    uniform vec2 screen_size_${this.id};
    uniform vec2 resolution_${this.id};
    void getRay_${this.id}(out Ray ray);
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    GlEntity.setGlUniformFloat(gl, program, `position_${this.id}`,
      this.position.x, this.position.y, this.position.z
    );
    GlEntity.setGlUniformFloat(gl, program, `rotation_${this.id}`,
      this.rotation.xyz.x, this.rotation.xyz.y, this.rotation.xyz.z, this.rotation.w
    );
    GlEntity.setGlUniformFloat(gl, program, `screen_size_${this.id}`,
      this.screen_size.x, this.screen_size.y
    );
    GlEntity.setGlUniformFloat(gl, program, `resolution_${this.id}`,
      this.resolution.x, this.resolution.y
    );
  }
  override getGlImplements(): string {return `
    ${this.GlFunc_getRay()}
  `;}
  abstract GlFunc_getRay(): string;
}


export class Drawable extends GlEntity {
  shape: Shape3D;
  material: Material;
  constructor(shape: Shape3D, material: Material) {
    super();
    this.shape = shape;
    this.material = material;
  }
  override getGlDeclarations(): string {
    return `
      ${this.shape.getGlDeclarations()}
      ${this.material.getGlDeclarations()}
      float getDistance_${this.id} (vec3 point);
      vec3 getNormal_${this.id} (vec3 point);
      vec3 getAmbient_${this.id} (vec3 point, in Ray view);
      vec3 getDiffuse_${this.id} (vec3 point, in Photon photon, in Ray view);
      vec3 getSpecular_${this.id} (vec3 point, in Photon photon, in Ray view);
    `;
  }
  override getGlImplements(): string {
    return `
      ${this.shape.getGlImplements()}
      ${this.material.getGlImplements()}
      float getDistance_${this.id} (vec3 point) {
        return getDistance_${this.shape.id}(point);
      }
      vec3 getNormal_${this.id} (vec3 point) {
        return getNormal_${this.shape.id}(point);
      }
      vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
        return getAmbient_${this.material.id}(point, view);
      }
      vec3 getDiffuse_${this.id} (vec3 point, in Photon photon, in Ray view) {
        vec3 normal = getNormal_${this.id}(point);
        return getDiffuse_${this.material.id}(point, normal, photon, view);
      }
      vec3 getSpecular_${this.id} (vec3 point, in Photon photon, in Ray view) {
        vec3 normal = getNormal_${this.id}(point);
        return getSpecular_${this.material.id}(point, normal, photon, view);
      }
    `;
  }
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.shape.setGlVars(gl, program);
    this.material.setGlVars(gl, program);
  }
}
