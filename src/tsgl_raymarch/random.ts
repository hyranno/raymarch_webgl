import {GlEntity} from './gl_entity';

export function uint16ToFloat01(v: number): number{
  return v / ((1<<16)-1);
}
export function rotr16(x: number, shift: number): number{
  return x >> shift | (x & (1<<shift)-1) << (16-shift);
}
export class PCG16 { //PCG-XSH-RR
  static mult: number = 0xf156da97;
  static incr: number = 0x7f94a2d3;
  state: number;
  static init(seed: number): number {
    let state = seed + PCG16.incr;
    let res = PCG16.rand(state);
    return res.state;
  }
  static rand(state: number): {value: number, state: number} {
    let bits_in = 32;
    let bits_out = bits_in/2;
    let m = Math.log2(bits_in) - 1;
    let x = state;
    let count = x >> (bits_in-m);
    state = (x * PCG16.mult + PCG16.incr) & 0xffff_ffff;
    x ^= x >> (bits_in-(bits_out-m))/2;
    let value = rotr16(x >> bits_out-m, count);
    return {value: value, state: state};
  }
  static rand_uniform(state: number): {value: number, state: number} {
    let res = PCG16.rand(state);
    res.value = uint16ToFloat01(res.value);
    return res;
  }
  static rand_normal(state: number): {value: number, state: number} { // Polar's Method
    let x = PCG16.rand_uniform(state);
    let y = PCG16.rand_uniform(x.state);
    let s = (x.value*x.value + y.value*y.value);
    let r = Math.sqrt(-2*Math.log(s)/s);
    return {value: x.value*r, state: y.state}; //and y.value*r
  }
  static rand_exponential(state: number): {value: number, state: number} {
    let average = 1;
    let res = PCG16.rand_uniform(state);
    return {value: -average*Math.log(1.0-res.value), state: res.state};
  }
  constructor(seed: number) {
    this.state = seed + PCG16.incr;
    this.rand();
  }
  rand(): number {
    let res = PCG16.rand(this.state);
    this.state = res.state;
    return res.value;
  }
  rand_uniform(): number {
    let res = PCG16.rand_uniform(this.state);
    this.state = res.state;
    return res.value;
  }
  rand_normal(): number {
    let res = PCG16.rand_normal(this.state);
    this.state = res.state;
    return res.value;
  }
  rand_exponential(): number {
    let res = PCG16.rand_exponential(this.state);
    this.state = res.state;
    return res.value;
  }
}

export function hash32(data: number[]): number {
  let seed = 0x655e774f;
  let mul = 0x8f5e;
  for (let i=0; i<data.length; i++) {
    let r = new PCG16(seed + data[i]);
    seed = r.rand() * mul;
  }
  return seed;
}


export abstract class GlRandom extends GlEntity {
  abstract rand(state: number): {value: number, state: number};
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
      ${super.getGlDeclarations()}
      float rand_${this.id} (inout uint state);
  `;}
}
export class Constant extends GlRandom {
  value: number;
  constructor(value: number) {
    super();
    this.value = value;
  }
  override rand(state: number): {value: number, state: number} {
    return {value: this.value, state: state};
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float value_${this.id};
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    float rand_${this.id} (inout uint state) {
      return value_${this.id};
    }`;
  }
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `value_${this.id}`, this.value);
  }
}
export class Uniform extends GlRandom {
  override rand(state: number): {value: number, state: number} {
    return PCG16.rand_uniform(state);
  }
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    float rand_${this.id} (inout uint state) {
      return rand_uniform(state);
    }`;
  }
}
export class Normal extends GlRandom {
  override rand(state: number): {value: number, state: number} {
    return PCG16.rand_normal(state);
  }
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    float rand_${this.id} (inout uint state) {
      return rand_normal(state);
    }`;
  }
}
export class Exponential extends GlRandom {
  override rand(state: number): {value: number, state: number} {
    return PCG16.rand_exponential(state);
  }
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    float rand_${this.id} (inout uint state) {
      return rand_exponential(state);
    }`;
  }
}
