export class Vec2D {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  clone(): Vec2D {
    return new Vec2D(this.x, this.y);
  }
  add(v: Vec2D): Vec2D {
    return new Vec2D(this.x + v.x, this.y + v.y);
  }
  mul(scale: number): Vec2D {
    return new Vec2D(this.x*scale, this.y*scale);
  }
  negative(): Vec2D {
    return new Vec2D(-this.x, -this.y);
  }
  rotate(rad: number): Vec2D {
    return new Vec2D(this.x*Math.cos(rad) - this.y*Math.sin(rad), this.x*Math.sin(rad) + this.y*Math.cos(rad));
  }
  dot(v: Vec2D): number {
    return v.x*this.x + v.y*this.y;
  }
  len(): number {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }
  normalize(): Vec2D {
    return this.mul(1/this.len());
  }
}

export class Vec3D {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  clone(): Vec3D {
    return new Vec3D(this.x, this.y, this.z);
  }
  add(v: Vec3D): Vec3D {
    return new Vec3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  mul(scale: number): Vec3D {
    return new Vec3D(this.x*scale, this.y*scale, this.z*scale);
  }
  negative(): Vec3D {
    return new Vec3D(-this.x, -this.y, -this.z);
  }
  rotate(q: Quaternion): Vec3D {
    return q.mul(new Quaternion(this, 0)).mul(q.inverse()).xyz;
  }
  dot(v: Vec3D): number {
    return v.x*this.x + v.y*this.y + v.z*this.z;
  }
  cross(v: Vec3D) : Vec3D {
    return new Vec3D(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x);
  }
  len(): number {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }
  normalize(): Vec3D {
    return this.mul(1/this.len());
  }
}

export class Quaternion {
  xyz: Vec3D;
  w: number;
  constructor(xyz: Vec3D, w: number) {
    this.xyz = xyz;
    this.w = w;
  }
  static fromNumbers(x: number, y: number, z: number, w: number): Quaternion {
    return new Quaternion(new Vec3D(x,y,z), w);
  }
  static fromDCM(dcm: Array<Array<number>>): Quaternion {
    const w  = Math.sqrt((+dcm[0][0] +dcm[1][1] +dcm[2][2] + 1)/4);
    const tx = Math.sqrt((+dcm[0][0] -dcm[1][1] -dcm[2][2] + 1)/4);
    const ty = Math.sqrt((-dcm[0][0] +dcm[1][1] -dcm[2][2] + 1)/4);
    const tz = Math.sqrt((-dcm[0][0] -dcm[1][1] +dcm[2][2] + 1)/4);
    const x = tx * Math.sign(dcm[1][2] - dcm[2][1]);
    const y = ty * Math.sign(dcm[2][0] - dcm[0][2]);
    const z = tz * Math.sign(dcm[0][1] - dcm[1][0]);
    return new Quaternion(new Vec3D(x,y,z), w);
  }
  static fromXY(x: Vec3D, y: Vec3D): Quaternion {
    const z = x.cross(y);
    const x_ = x.normalize();
    const y_ = y.normalize();
    const z_ = z.normalize();
    const m = [
      [x_.x, y_.x, z_.x],
      [x_.y, y_.y, z_.y],
      [x_.z, y_.z, z_.z]
    ];
    const determinant =
      +m[0][0]*m[1][1]*m[2][2]
      -m[0][0]*m[1][2]*m[2][1]
      +m[0][1]*m[1][2]*m[2][0]
      -m[0][1]*m[1][0]*m[2][2]
      +m[0][2]*m[1][0]*m[2][1]
      -m[0][2]*m[1][1]*m[2][0]
    ;
    return Quaternion.fromDCM(m.map((v)=>v.map((e)=>e/determinant)));
  }
  static fromAngleAxis(rad: number, axis: Vec3D): Quaternion {
    const a = axis.normalize();
    return new Quaternion(a.mul(Math.sin(rad/2)), Math.cos(rad/2));
  }
  static fromSrcDest(src: Vec3D, dest: Vec3D): Quaternion {
    const cross = src.cross(dest);
    const axis = cross.normalize();
    const sin = cross.len();
    const cos = src.dot(dest);
    return Quaternion.fromAngleAxis(Math.atan2(sin, cos), axis);
  }
  clone(): Quaternion {
    return new Quaternion(this.xyz, this.w);
  }
  inverse(): Quaternion {
    return new Quaternion(this.xyz.negative(), this.w);
  }
  mul(q: Quaternion): Quaternion {
    return new Quaternion(
      this.xyz.cross(q.xyz).add(q.xyz.mul(this.w)).add(this.xyz.mul(q.w)),
      this.w*q.w - this.xyz.dot(q.xyz)
    );
  }
}


export function asTemplate(str: string, params: Object) {
  const keys = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...keys, `return \`${str}\`;`)(...vals);
}


export function rotr32(x: number, shift: number): number{
  return x >> shift | (x & (1<<shift)-1) << (32-shift);
}
export class PCG32 { //PCG-XSH-RR
  static mult: bigint = 6364136223846793005n;
  static incr: bigint = 1442695040888963407n;
  state: bigint;
  constructor(seed: bigint) {
    this.state = seed + PCG32.incr;
    this.rand();
  }
  rand(): number {
    var bits_in = 64;
    var bits_out = bits_in/2;
    var m = Math.log2(bits_in) - 1;
    var x = this.state;
    var count = Number(x >> BigInt(bits_in-m));
    this.state = (x * PCG32.mult + PCG32.incr) & (0xffff_ffff_ffff_ffffn);
    x ^= x >> BigInt((bits_in-(bits_out-m))/2);
    return rotr32(Number(x >> BigInt(bits_out-m)), count);
  }
}

export function rotr16(x: number, shift: number): number{
  return x >> shift | (x & (1<<shift)-1) << (16-shift);
}
export class PCG16 { //PCG-XSH-RR
  static mult: number = 0xf156da97;
  static incr: number = 0x7f94a2d3;
  state: number;
  constructor(seed: number) {
    this.state = seed + PCG16.incr;
    this.rand();
  }
  rand(): number {
    var bits_in = 32;
    var bits_out = bits_in/2;
    var m = Math.log2(bits_in) - 1;
    var x = this.state;
    var count = x >> (bits_in-m);
    this.state = (x * PCG16.mult + PCG16.incr) & 0xffff_ffff;
    x ^= x >> (bits_in-(bits_out-m))/2;
    return rotr16(x >> bits_out-m, count);
  }
}

export function hash32(data: number[]): number {
  var seed = 0x655e774f;
  var mul = 0x8f5e;
  for (var i=0; i<data.length; i++) {
    var r = new PCG16(seed + data[i]);
    seed = r.rand() * mul;
  }
  return seed;
}
