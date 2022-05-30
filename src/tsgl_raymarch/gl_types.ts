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


export interface HasGlType {
  getGlTypeString(): string;
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void;
}
export interface HasGlTypeStatic {
  new(...args :any[]): HasGlType;
  glTypeString: string;
  default(): HasGlType;
}

function staticImplements<T>() {/* class decorator */
    return <U extends T>(constructor: U) => {constructor};
}

@staticImplements<HasGlTypeStatic>()
export class GlFloat implements HasGlType {
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

@staticImplements<HasGlTypeStatic>()
export class GlInt implements HasGlType {
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

@staticImplements<HasGlTypeStatic>()
export class GlVec2 extends util.Vec2 implements HasGlType {
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
@staticImplements<HasGlTypeStatic>()
export class GlVec3 extends util.Vec3 implements HasGlType {
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
@staticImplements<HasGlTypeStatic>()
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
