export class Vec2D {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  static zero(): Vec2D {
    return new Vec2D(0,0);
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
  map(f: (v:number)=>number): Vec2D {
    return new Vec2D(f(this.x), f(this.y));
  }
  rounds(): Vec2D[] {
    var res = new Array<Vec2D>(1<<2);
    return res.map((_,i) =>
      new Vec2D(
        Math.floor(this.x)+((i>>0)&1),
        Math.floor(this.y)+((i>>1)&1)
      )
    );
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
  static zero(): Vec3D {
    return new Vec3D(0,0,0);
  }
  clone(): Vec3D {
    return this.map((v) => v);
  }
  add(v: Vec3D): Vec3D {
    return new Vec3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  mul(scale: number): Vec3D {
    return this.map((v) => v*scale);
  }
  negative(): Vec3D {
    return this.map((v) => -v);
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
  map(f: (v:number)=>number): Vec3D {
    return new Vec3D(f(this.x), f(this.y), f(this.z));
  }
  rounds(): Vec3D[] {
    var res = new Array<Vec3D>(1<<3);
    return res.map((_,i) =>
      new Vec3D(
        Math.floor(this.x)+((i>>0)&1),
        Math.floor(this.y)+((i>>1)&1),
        Math.floor(this.z)+((i>>2)&1)
      )
    );
  }
}

export class Quaternion {
  xyz: Vec3D;
  w: number;
  constructor(xyz: Vec3D, w: number) {
    this.xyz = xyz;
    this.w = w;
  }
  static identity(): Quaternion {
    return Quaternion.fromAngleAxis(0, new Vec3D(1,0,0));
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

// type Mat2Index = 0 | 1 ;
export class Mat2 {
  static fromNumbers(rows: [[number, number], [number, number]]): Mat2 {
    return Mat2.fromClosure((i,j) => rows[i][j]);
  }
  static zero(): Mat2 {
    return Mat2.fromNumbers([[0,0],[0,0]]);
  }
  static identity(): Mat2 {
    return Mat2.fromNumbers([[1,0],[0,1]]);
  }
  static fromClosure(f :(i:number, j:number)=>number): Mat2 {
    var res = new Mat2();
    for (var i=0; i<2; i++) {
      res[i] = [];
      for (var j=0; j<2; j++) {
        res[i][j] = f(i,j);
      }
    }
    return res;
  }
  clone(): Mat2 {
    return Mat2.fromNumbers([this[0],this[1]]);
  }
  determinant(): number {
    return (
      +this[0][0]*this[1][1]
      -this[0][1]*this[1][0]
    );
  }
  cofactor(): Mat2 {
    return Mat2.fromNumbers([[this[1][1],-this[0][1]], [-this[1][0],this[0][0]]]);
  }
  inverse(): Mat2 {
    return this.cofactor().mulScalar(1/this.determinant());
  }
  transpose(): Mat2 {
    return Mat2.fromClosure((i,j) => this[j][i]);
  }
  map(f :(v:number)=>number): Mat2 {
    return Mat2.fromNumbers([this[0].map(f), this[1].map(f)]);
  }
  getRow(i: number): Vec2D{
    return new Vec2D(this[i][0], this[i][1]);
  }
  getCol(j: number): Vec2D{
    return new Vec2D(this[0][j], this[1][j]);
  }
  addScalar(n: number): Mat2 {
    return this.map((v)=>v+n);
  }
  mulScalar(n: number): Mat2 {
    return this.map((v)=>v*n);
  }
  add(m: Mat2): Mat2 {
    return Mat2.fromClosure((i,j) => this[i][j]+m[i][j]);
  }
  mul(m: Mat2): Mat2 {
    return Mat2.fromClosure((i,j) => this.getRow(i).dot(m.getCol(j)));
  }
  mul2x1(v: Vec2D): Vec2D {
    return new Vec2D(this.getRow(0).dot(v), this.getRow(1).dot(v));
  }
}

// type Mat3Index = 0 | 1 | 2 ;
export class Mat3 {
  static fromNumbers(rows: [[number, number, number], [number, number, number], [number, number, number]]): Mat3 {
    return Mat3.fromClosure((i,j) => rows[i][j]);
  }
  static zero(): Mat3 {
    return Mat3.fromNumbers([[0,0,0],[0,0,0],[0,0,0]]);
  }
  static identity(): Mat3 {
    return Mat3.fromNumbers([[1,0,0],[0,1,0],[0,0,1]]);
  }
  static fromClosure(f :(i:number, j:number)=>number): Mat3 {
    var res = new Mat3();
    for (var i=0; i<3; i++) {
      res[i] = [];
      for (var j=0; j<3; j++) {
        res[i][j] = f(i,j);
      }
    }
    return res;
  }
  clone(): Mat3 {
    return Mat3.fromNumbers([this[0],this[1],this[3]]);
  }
  determinant(): number {
    return (
      +this[0][0]*this[1][1]*this[2][2]
      +this[0][1]*this[1][2]*this[2][0]
      +this[0][2]*this[1][0]*this[2][1]
      -this[0][2]*this[1][1]*this[2][0]
      -this[0][1]*this[1][0]*this[2][2]
      -this[0][0]*this[1][2]*this[2][1]
    );
  }
  skip(i: number, j: number): Mat2 {
    return Mat2.fromClosure((i_,j_) => this[i_+(i_<i? 0:1)][j_+(j_<j? 0:1)]);
  }
  cofactor(): Mat3 {
    return Mat3.fromClosure( (i,j) => (i%2 == j%2? 1:-1) * this.skip(j,i).determinant() );
  }
  inverse(): Mat3 {
    return this.cofactor().mulScalar(1/this.determinant());
  }
  transpose(): Mat3 {
    return Mat3.fromClosure((i,j) => this[j][i]);
  }
  map(f :(v:number)=>number): Mat3 {
    return Mat3.fromNumbers([this[0].map(f), this[1].map(f), this[2].map(f)]);
  }
  getRow(i: number): Vec3D{
    return new Vec3D(this[i][0], this[i][1], this[i][2]);
  }
  getCol(j: number): Vec3D{
    return new Vec3D(this[0][j], this[1][j], this[2][j]);
  }
  addScalar(n: number): Mat3 {
    return this.map((v)=>v+n);
  }
  mulScalar(n: number): Mat3 {
    return this.map((v)=>v*n);
  }
  add(m: Mat3): Mat3 {
    return Mat3.fromClosure((i,j) => this[i][j]+m[i][j]);
  }
  mul(m: Mat3): Mat3 {
    return Mat3.fromClosure((i,j) => this.getRow(i).dot(m.getCol(j)));
  }
  mul3x1(v: Vec3D): Vec3D {
    return new Vec3D( this.getRow(0).dot(v), this.getRow(1).dot(v), this.getRow(2).dot(v) );
  }
}


export class TetrahedronCoord extends Vec3D {
  static basis = Mat3.fromNumbers([
    [+Math.cos(Math.PI/6.0), +Math.sin(Math.PI/6.0), 0],
    [+Math.cos(Math.PI/6.0), -Math.sin(Math.PI/6.0), 0],
    [Math.sqrt(1.0/3.0), 0, Math.sqrt(2.0/3.0)]
  ]).transpose();
  static invBasis = TetrahedronCoord.basis.inverse();
  static TetrahedronCenter = (
    TetrahedronCoord.basis.getCol(0)
    .add(TetrahedronCoord.basis.getCol(1))
    .add(TetrahedronCoord.basis.getCol(2))
  ).mul(1/4);
  static asTetrahedronCoord(v: Vec3D): TetrahedronCoord {
    return new TetrahedronCoord(v.x, v.y, v.z);
  }
  static fromOrthogonal(v: Vec3D): TetrahedronCoord {
    return TetrahedronCoord.asTetrahedronCoord( TetrahedronCoord.invBasis.mul3x1(v) );
  }
  toOrthogonal(): Vec3D {
    return TetrahedronCoord.basis.mul3x1(this);
  }
}



export class Range implements IterableIterator<number> {
  private count = 0;
  constructor(public min: number, public max: number) {}
  next(): IteratorResult<number> {
    return {
      done: this.count >= this.max,
      value: this.count++
    };
  }
  [Symbol.iterator](): IterableIterator<number> {
    return this;
  }
}


export function asTemplate(str: string, params: Object) {
  const keys = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...keys, `return \`${str}\`;`)(...vals);
}


export function clamp(v:number, bottom: number, top: number): number {
  return Math.max(Math.min(v, top), bottom);
}
export function mix(v1:number, v2: number, t: number): number {
  return (t-1)*v1 + t*v2;
}

export function blend(v1: number, v2: number, isMin: boolean, smoothness: number, weight: number): number {
  var s = isMin? -1: 1;
  var h = 0.5 - s*0.5*clamp((v2-v1) / smoothness, -1.0, 1.0);
  h = Math.pow(h, 1/weight);
  var d = smoothness*h*(1.0-h); // > mix(v2,v1,h)-min(v2,v1)
  return mix(v2,v1,h) + s*d;
}

export function smoothmin(v1: number, v2: number, smoothness: number): number {
  return blend(v1,v2,true,smoothness,1);
}
export function smoothmax(v1: number, v2: number, smoothness: number): number {
  return blend(v1,v2,false,smoothness,1);
}
export function smoothclamp(v: number, bottom: number, top: number, smoothness: number): number {
  return smoothmax(smoothmin(v, top, smoothness), bottom, smoothness);
}
