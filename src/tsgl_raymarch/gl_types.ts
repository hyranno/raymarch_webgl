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

export class GlFloat implements HasGlType {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  getGlTypeString(): string {
    return "float";
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.value);
  }
}
export class GlInt implements HasGlType {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  getGlTypeString(): string {
    return "int";
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformInt(gl, program, name, this.value);
  }
}

export class GlVec2 extends util.Vec2 implements HasGlType {
  constructor(v: util.Vec2){
    super(v[0], v[1]);
  }
  getGlTypeString(): string {
    return "vec2";
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this[0], this[1]);
  }
}
export class GlVec3 extends util.Vec3 implements HasGlType {
  constructor(v: util.Vec3){
    super(v[0], v[1], v[2]);
  }
  getGlTypeString(): string {
    return "vec3";
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this[0], this[1], this[2]);
  }
}
export class GlQuaternion extends util.Quaternion implements HasGlType {
  constructor(v: util.Quaternion){
    super(v.xyz, v.w);
  }
  getGlTypeString(): string {
    return "vec4";
  }
  setGlUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): void {
    setGlUniformFloat(gl, program, name, this.xyz[0], this.xyz[1], this.xyz[2], this.w);
  }
}
