import * as util from './util';

export function setGlUniformInt(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, ...values: number[]): void {
  let location: WebGLUniformLocation = gl.getUniformLocation(program, name);
  let f = [gl.uniform1iv, gl.uniform2iv, gl.uniform3iv, gl.uniform4iv, ];
  f[values.length-1].call(gl, location, values);
}

export function setGlUniformFloat(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, ...values: number[]): void {
  let location: WebGLUniformLocation = gl.getUniformLocation(program, name);
  let f = [gl.uniform1fv, gl.uniform2fv, gl.uniform3fv, gl.uniform4fv, ];
  f[values.length-1].call(gl, location, values);
}


export interface GlAdditive {}

export interface HasGlType {
  getGlTypeString(): string;
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void;
}
export interface HasGlTypeStatic<T extends HasGlType> {
  new(...args :any[]): T;
  readonly glTypeString: string;
  default(): T;
}

function staticImplements<T>() {/* class decorator */
    return <U extends T>(constructor: U) => {constructor};
}

@staticImplements<HasGlTypeStatic<GlFloat>>()
export class GlFloat implements HasGlType, GlAdditive {
  static glTypeString: string = "float";
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  static default(): GlFloat {
    return new GlFloat(0);
  }
  getGlTypeString(): string {
    return GlFloat.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.value);
  }
}

@staticImplements<HasGlTypeStatic<GlInt>>()
export class GlInt implements HasGlType, GlAdditive {
  static glTypeString: string = "int";
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  static default(): GlInt {
    return new GlInt(0);
  }
  getGlTypeString(): string {
    return GlInt.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformInt(gl, program, name, this.value);
  }
}

@staticImplements<HasGlTypeStatic<GlVec2>>()
export class GlVec2 extends util.Vec2 implements HasGlType, GlAdditive {
  static glTypeString: string = "vec2";
  constructor(value: util.Vec2){
    super(value[0], value[1]);
  }
  static default(): GlVec2 {
    return new GlVec2(new util.Vec2(0,0));
  }
  getGlTypeString(): string {
    return GlVec2.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this[0], this[1]);
  }
}
@staticImplements<HasGlTypeStatic<GlVec3>>()
export class GlVec3 extends util.Vec3 implements HasGlType, GlAdditive {
  static glTypeString: string = "vec3";
  constructor(value: util.Vec3){
    super(value[0], value[1], value[2]);
  }
  static default(): GlVec3 {
    return new GlVec3(new util.Vec3(0,0,0));
  }
  getGlTypeString(): string {
    return GlVec3.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this[0], this[1], this[2]);
  }
}
@staticImplements<HasGlTypeStatic<GlQuaternion>>()
export class GlQuaternion extends util.Quaternion implements HasGlType {
  static glTypeString: string = "vec4";
  constructor(value: util.Quaternion){
    super(value.xyz, value.w);
  }
  static default(): GlQuaternion{
    return new GlQuaternion(util.Quaternion.identity());
  }
  getGlTypeString(): string {
    return GlQuaternion.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.xyz[0], this.xyz[1], this.xyz[2], this.w);
  }
}


@staticImplements<HasGlTypeStatic<TexturePatch>>()
export class TexturePatch implements HasGlType, GlAdditive {
  albedo: util.Vec3;
  roughness: number;
  specular: number;
  //point: util.Vec3;
  //normal: util.Vec3;
  static glTypeString: string = "TexturePatch";
  constructor(albedo: util.Vec3, roughness: number, specular: number) {
    this.albedo = albedo;
    this.roughness = roughness;
    this.specular = specular;
  }
  static default(): TexturePatch {
    let res = new TexturePatch(new util.Vec3(0,0,0), 0, 0);
    return res;
  }
  getGlTypeString(): string {
    return TexturePatch.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, `${name}.albedo`, this.albedo[0], this.albedo[1], this.albedo[2]);
    setGlUniformFloat(gl, program, `${name}.roughness`, this.roughness);
    setGlUniformFloat(gl, program, `${name}.specular`, this.specular);
  }
}

@staticImplements<HasGlTypeStatic<Transform>>()
export class Transform implements HasGlType {
  scale: number;
  rotation: util.Quaternion;
  translate: util.Vec3;
  static glTypeString: string = "Transform";
  constructor(scale: number, rotation: util.Quaternion, translate: util.Vec3) {
    this.scale = scale;
    this.rotation = rotation;
    this.translate = translate;
  }
  static default(): Transform {
    let res = new Transform(1, util.Quaternion.identity(), new util.Vec3(0,0,0));
    return res;
  }
  getGlTypeString(): string {
    return Transform.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, `${name}.scale`, this.scale);
    setGlUniformFloat(gl, program, `${name}.rotation`, this.rotation.xyz[0], this.rotation.xyz[1], this.rotation.xyz[2], this.rotation.w);
    setGlUniformFloat(gl, program, `${name}.translate`, this.translate[0], this.translate[1], this.translate[2]);
  }
  transform(p: util.Vec3): util.Vec3 {
    let res: util.Vec3 = p.clone();
    return res.mul(this.scale).rotate(this.rotation).add(this.translate);
  }
  inverse(p: util.Vec3): util.Vec3 {
    let res: util.Vec3 = p.add(this.translate.negative()).rotate(this.rotation.inverse()).mul(1/this.scale);
    return res;
  }
}
