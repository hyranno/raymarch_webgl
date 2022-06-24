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

export function setGlUniformMatrix(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, ...values: number[]): void {
  let location: WebGLUniformLocation = gl.getUniformLocation(program, name);
  let f = [null, gl.uniformMatrix2fv, gl.uniformMatrix3fv, gl.uniformMatrix4fv, ];
  f[Math.sqrt(values.length)-1].call(gl, location, false, values);
}

export type TsTupleType<T> =
  T extends [infer U, ...infer V] ? [TsType<U>, ...TsTupleType<V>] : [];

export type TsType<T> =
  T extends GlFloat ? number :
  T extends GlInt ? number :
  T extends GlVec2 ? util.Vec2 :
  T extends GlVec3 ? util.Vec3 :
  T extends GlQuaternion ? util.Quaternion :
  T extends Transform ? Transform :
  never;

export interface GlAdditive {
  add(v: ReturnType<typeof this>): ReturnType<typeof this>;
  mul(scale: number): ReturnType<typeof this>;
}

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
  add(v: GlFloat): GlFloat {
    return new GlFloat(this.value + v.value);
  }
  mul(scale: number): GlFloat {
    return new GlFloat(this.value * scale);
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
  add(v: GlInt): GlInt {
    return new GlInt(this.value + v.value);
  }
  mul(scale: number): GlInt {
    return new GlInt(this.value * scale);
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
export class GlVec2 implements HasGlType, GlAdditive {
  static glTypeString: string = "vec2";
  value: util.Vec2;
  constructor(value: util.Vec2){
    this.value = value;
  }
  add(v: GlVec2): GlVec2 {
    return new GlVec2(this.value.add(v.value));
  }
  mul(scale: number): GlVec2 {
    return new GlVec2(this.value.mul(scale));
  }
  static default(): GlVec2 {
    return new GlVec2(new util.Vec2(0,0));
  }
  getGlTypeString(): string {
    return GlVec2.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.value[0], this.value[1]);
  }
}
@staticImplements<HasGlTypeStatic<GlVec3>>()
export class GlVec3 implements HasGlType, GlAdditive {
  static glTypeString: string = "vec3";
  value: util.Vec3;
  constructor(value: util.Vec3){
    this.value = value;
  }
  add(v: GlVec3): GlVec3 {
    return new GlVec3(this.value.add(v.value));
  }
  mul(scale: number): GlVec3 {
    return new GlVec3(this.value.mul(scale));
  }
  static default(): GlVec3 {
    return new GlVec3(new util.Vec3(0,0,0));
  }
  getGlTypeString(): string {
    return GlVec3.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.value[0], this.value[1], this.value[2]);
  }
}
@staticImplements<HasGlTypeStatic<GlQuaternion>>()
export class GlQuaternion implements HasGlType {
  static glTypeString: string = "vec4";
  value: util.Quaternion;
  constructor(value: util.Quaternion){
    this.value = value;
  }
  static default(): GlQuaternion{
    return new GlQuaternion(util.Quaternion.identity());
  }
  getGlTypeString(): string {
    return GlQuaternion.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.value.xyz[0], this.value.xyz[1], this.value.xyz[2], this.value.w);
  }
}

@staticImplements<HasGlTypeStatic<GlMat4>>()
export class GlMat4 implements HasGlType {
  static glTypeString: string = "mat4";
  value: util.Mat4;
  constructor(value: util.Mat4){
    this.value = value;
  }
  static default(): GlMat4 {
    return new GlMat4(util.Mat4.identity());
  }
  getGlTypeString(): string {
    return GlMat4.glTypeString;
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformMatrix(gl, program, name,
      this.value[0][0], this.value[1][0], this.value[2][0], this.value[3][0],
      this.value[0][1], this.value[1][1], this.value[2][1], this.value[3][1],
      this.value[0][2], this.value[1][2], this.value[2][2], this.value[3][2],
      this.value[0][3], this.value[1][3], this.value[2][3], this.value[3][3],
    );
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
  add(v: TexturePatch): TexturePatch {
    return new TexturePatch(this.albedo.add(v.albedo), this.roughness + v.roughness, this.specular + v.specular);
  }
  mul(scale: number): TexturePatch {
    return new TexturePatch(this.albedo.mul(scale), this.roughness*scale, this.specular*scale);
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
    setGlUniformFloat(gl, program, `${name}.translate`, this.translate[0], this.translate[1], this.translate[2]);
    setGlUniformFloat(gl, program, `${name}.rotation`, this.rotation.xyz[0], this.rotation.xyz[1], this.rotation.xyz[2], this.rotation.w);
    setGlUniformFloat(gl, program, `${name}.scale`, this.scale);
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
