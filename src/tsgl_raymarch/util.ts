export class Vec2 {
  constructor(x: number, y: number) {
    this[0] = x;
    this[1] = y;
  }
  static zero(): Vec2 {
    return new Vec2(0,0);
  }
  static fromClosure(f :(i:number)=>number): Vec2 {
    let res = Vec2.zero();
    for (let i=0; i<2; i++) {
      res[i] = f(i);
    }
    return res;
  }
  clone(): Vec2 {
    return Vec2.fromClosure((i)=>this[i]);
  }
  add(v: Vec2): Vec2 {
    return Vec2.fromClosure((i) => this[i]+v[i]);
  }
  mul(scale: number): Vec2 {
    return this.map((v)=>v*scale);
  }
  negative(): Vec2 {
    return this.mul(-1);
  }
  rotate(rad: number): Vec2 {
    let m = Mat2.fromNumbers([[Math.cos(rad), -Math.sin(rad)], [Math.sin(rad), Math.cos(rad)]]);
    return m.mul2x1(this);
  }
  dot(v: Vec2): number {
    return v[0]*this[0] + v[1]*this[1];
  }
  len(): number {
    return Math.sqrt(this.dot(this));
  }
  normalize(): Vec2 {
    return this.mul(1/this.len());
  }
  map(f: (v:number)=>number): Vec2 {
    return Vec2.fromClosure((i)=>f(this[i]));
  }
  rounds(): Vec2[] {
    let res = (new Array<Vec2>(1<<2)).fill(new Vec2(0,0));
    return res.map((_,i) =>
      new Vec2(
        Math.floor(this[0])+((i>>0)&1),
        Math.floor(this[1])+((i>>1)&1)
      )
    );
  }
}

export class Vec3 {
  constructor(x: number, y: number, z: number) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
  }
  static zero(): Vec3 {
    return new Vec3(0,0,0);
  }
  static fromClosure(f :(i:number)=>number): Vec3 {
    let res = Vec3.zero();
    for (let i=0; i<3; i++) {
      res[i] = f(i);
    }
    return res;
  }
  clone(): Vec3 {
    return this.map((v) => v);
  }
  add(v: Vec3): Vec3 {
    return Vec3.fromClosure((i) => this[i]+v[i]);
  }
  mul(scale: number): Vec3 {
    return this.map((v) => v*scale);
  }
  negative(): Vec3 {
    return this.map((v) => -v);
  }
  rotate(q: Quaternion): Vec3 {
    return q.mul(new Quaternion(this, 0)).mul(q.inverse()).xyz;
  }
  dot(v: Vec3): number {
    return v[0]*this[0] + v[1]*this[1] + v[2]*this[2];
  }
  cross(v: Vec3) : Vec3 {
    return new Vec3(this[1]*v[2] - this[2]*v[1], this[2]*v[0] - this[0]*v[2], this[0]*v[1] - this[1]*v[0]);
  }
  len(): number {
    return Math.sqrt(this.dot(this));
  }
  normalize(): Vec3 {
    return this.mul(1/this.len());
  }
  map(f: (v:number)=>number): Vec3 {
    return new Vec3(f(this[0]), f(this[1]), f(this[2]));
  }
  rounds(): Vec3[] {
    let res = (new Array<Vec3>(1<<3)).fill(new Vec3(0,0,0));
    return res.map((_,i) =>
      new Vec3(
        Math.floor(this[0])+((i>>0)&1),
        Math.floor(this[1])+((i>>1)&1),
        Math.floor(this[2])+((i>>2)&1)
      )
    );
  }
}

export class Quaternion {
  xyz: Vec3;
  w: number;
  constructor(xyz: Vec3, w: number) {
    this.xyz = xyz;
    this.w = w;
  }
  static identity(): Quaternion {
    return Quaternion.fromAngleAxis(0, new Vec3(1,0,0));
  }
  static fromNumbers(x: number, y: number, z: number, w: number): Quaternion {
    return new Quaternion(new Vec3(x,y,z), w);
  }
  static fromDCM(dcm: Mat3): Quaternion {
    let res = [0,0,0,0];
    const a4v = [
      2 *Math.sqrt(+dcm[0][0] -dcm[1][1] -dcm[2][2] + 1),
      2 *Math.sqrt(-dcm[0][0] +dcm[1][1] -dcm[2][2] + 1),
      2 *Math.sqrt(-dcm[0][0] -dcm[1][1] +dcm[2][2] + 1),
      2 *Math.sqrt(+dcm[0][0] +dcm[1][1] +dcm[2][2] + 1)
    ];
    let imax = 0;
    for (let i=1; i<4; i++) {
      imax = mix(imax, i, a4v[imax] < a4v[i] ?1:0);
    }
    let vs = [
      [0, dcm[0][1]+dcm[1][0], dcm[2][0]+dcm[0][2], dcm[1][2]-dcm[2][1]],
      [dcm[0][1]+dcm[1][0], 0, dcm[1][2]+dcm[2][1], dcm[2][0]-dcm[0][2]],
      [dcm[2][0]+dcm[0][2], dcm[1][2]+dcm[2][1], 0, dcm[0][1]-dcm[1][0]],
      [dcm[1][2]-dcm[2][1], dcm[2][0]-dcm[0][2], dcm[0][1]-dcm[1][0], 0]
    ];
    for (let i=0; i<4; i++) {
      res[i] = mix(vs[imax][i]/a4v[imax], a4v[imax]/4.0, i==imax? 1:0);
    }
    return Quaternion.fromNumbers(res[0], res[1], res[2], res[3]);
  }
/*  static fromDCM(dcm: Mat3): Quaternion {
    const w  = Math.sqrt(+dcm[0][0] +dcm[1][1] +dcm[2][2] + 1) / 2;
    const ax = Math.sqrt(+dcm[0][0] -dcm[1][1] -dcm[2][2] + 1) / 2;
    const ay = Math.sqrt(-dcm[0][0] +dcm[1][1] -dcm[2][2] + 1) / 2;
    const az = Math.sqrt(-dcm[0][0] -dcm[1][1] +dcm[2][2] + 1) / 2;
    const x = ax * (dcm[1][2] < dcm[2][1] ?-1:1); //mix(+1,-1, dcm[1][2] < dcm[2][1] ?1:0);
    const y = ay * (dcm[2][0] < dcm[0][2] ?-1:1); //mix(+1,-1, dcm[2][0] < dcm[0][2] ?1:0);
    const z = az * (dcm[0][1] < dcm[1][0] ?-1:1); //mix(+1,-1, dcm[0][1] < dcm[1][0] ?1:0);
    return new Quaternion(new Vec3(x,y,z), w);
  }*/
  static fromXY(x: Vec3, y: Vec3): Quaternion {
    const z = x.cross(y);
    const m = Mat3.fromCols([x.normalize(), y.normalize(), z.normalize()]);
    return Quaternion.fromDCM(m); //m.mulScalar(1/m.determinant())
  }
  static fromXZ(x: Vec3, z: Vec3): Quaternion {
    const y = x.cross(z).negative();
    const m = Mat3.fromCols([x.normalize(), y.normalize(), z.normalize()]);
    return Quaternion.fromDCM(m);
  }
  static fromAngleAxis(rad: number, axis: Vec3): Quaternion {
    const a = axis.normalize();
    return new Quaternion(a.mul(Math.sin(rad/2)), Math.cos(rad/2));
  }
  static fromSrcDest(src: Vec3, dest: Vec3): Quaternion {
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
    let res = new Mat2();
    for (let i=0; i<2; i++) {
      res[i] = [];
      for (let j=0; j<2; j++) {
        res[i][j] = f(i,j);
      }
    }
    return res;
  }
  static fromCols(cols: [Vec2, Vec2]): Mat2 {
    return Mat2.fromClosure((i,j) => cols[j][i]);
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
  getRow(i: number): Vec2{
    return new Vec2(this[i][0], this[i][1]);
  }
  getCol(j: number): Vec2{
    return new Vec2(this[0][j], this[1][j]);
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
  mul2x1(v: Vec2): Vec2 {
    return new Vec2(this.getRow(0).dot(v), this.getRow(1).dot(v));
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
    let res = new Mat3();
    for (let i=0; i<3; i++) {
      res[i] = [];
      for (let j=0; j<3; j++) {
        res[i][j] = f(i,j);
      }
    }
    return res;
  }
  static fromCols(cols: [Vec3, Vec3, Vec3]): Mat3 {
    return Mat3.fromClosure((i,j) => cols[j][i]);
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
  getRow(i: number): Vec3{
    return new Vec3(this[i][0], this[i][1], this[i][2]);
  }
  getCol(j: number): Vec3{
    return new Vec3(this[0][j], this[1][j], this[2][j]);
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
  mul3x1(v: Vec3): Vec3 {
    return new Vec3( this.getRow(0).dot(v), this.getRow(1).dot(v), this.getRow(2).dot(v) );
  }
}


export class Simplex3Coord extends Vec3 {
  static basis = Mat3.fromCols([
    new Vec3(+Math.cos(Math.PI/6.0), +Math.sin(Math.PI/6.0), 0),
    new Vec3(+Math.cos(Math.PI/6.0), -Math.sin(Math.PI/6.0), 0),
    new Vec3(Math.sqrt(1.0/3.0), 0, Math.sqrt(2.0/3.0))
  ]);
  static invBasis = Simplex3Coord.basis.inverse();
  static Simplex3Center = (
    Simplex3Coord.basis.getCol(0)
    .add(Simplex3Coord.basis.getCol(1))
    .add(Simplex3Coord.basis.getCol(2))
  ).mul(1/4);
  static asSimplex3Coord(v: Vec3): Simplex3Coord {
    return new Simplex3Coord(v[0], v[1], v[2]);
  }
  static fromOrthogonal(v: Vec3): Simplex3Coord {
    return Simplex3Coord.asSimplex3Coord( Simplex3Coord.invBasis.mul3x1(v) );
  }
  toOrthogonal(): Vec3 {
    return Simplex3Coord.basis.mul3x1(this);
  }
  override len(): number {
    return this.toOrthogonal().len();
  }
  round(): Simplex3Coord {
    let r = this.rounds().map((e) => Simplex3Coord.asSimplex3Coord(e));
    let n = r.reduce((prev, current) => (
      current.toOrthogonal().add(this.toOrthogonal().negative()).len() < prev.toOrthogonal().add(this.toOrthogonal().negative()).len()
    ) ? current : prev);
    return n;
  }
  neighbors(): Simplex3Coord[] {
    let center = this.round();
    return [
      center,
      center.add( new Vec3(+1, 0, 0) ),
      center.add( new Vec3( 0,+1, 0) ),
      center.add( new Vec3( 0, 0,+1) ),
      center.add( new Vec3(-1, 0, 0) ),
      center.add( new Vec3( 0,-1, 0) ),
      center.add( new Vec3( 0, 0,-1) ),
      center.add( new Vec3(+1,-1, 0) ),
      center.add( new Vec3(+1, 0,-1) ),
      center.add( new Vec3(-1,+1, 0) ),
      center.add( new Vec3( 0,+1,-1) ),
      center.add( new Vec3(-1, 0,+1) ),
      center.add( new Vec3( 0,-1,+1) )
    ].map((v)=>Simplex3Coord.asSimplex3Coord(v));
  }
}


export class ColorSpace {
  static RGB2HSV(rgb: Vec3): Vec3 {
    let maxval = Math.max(rgb[0], rgb[1], rgb[2]);
    let minval = Math.min(rgb[0], rgb[1], rgb[2]);
    let maxIndex = 0;
    for (let i=0; i<3; i++) {
      maxIndex = mix(maxIndex, i, rgb[maxIndex] < rgb[i] ?1:0);
    }
    let Hs = (maxval-minval == 0) ? 0 : 1/6 *((rgb[(maxIndex+1)%3] - rgb[(maxIndex+2)%3])/(maxval-minval) +2*maxIndex);
    let H = ((Hs % 1) + 1) % 1;
    let S = (maxval == 0) ? 0 : (maxval-minval)/maxval;
    let V = maxval;
    return new Vec3(H,S,V);
  }
  static HSV2RGB(hsv: Vec3): Vec3 {
    let maxval = hsv[2];
    let minval = maxval*(1-hsv[1]);
    let Hn = hsv[0] / (1/6);
    let Hi = Math.floor(Hn);
    //let maxIndex = Math.round(Hn/2) % 3;
    let vs = [
      new Vec3(maxval, (Hn)*(maxval-minval)+minval, minval),
      new Vec3(-(Hn-2)*(maxval-minval)+minval, maxval, minval),
      new Vec3(minval, maxval, +(Hn-2)*(maxval-minval)+minval),
      new Vec3(minval, -(Hn-4)*(maxval-minval)+minval, maxval),
      new Vec3(+(Hn-4)*(maxval-minval)+minval, minval, maxval),
      new Vec3(maxval, minval, -(Hn-6)*(maxval-minval)+minval),
    ];
    return vs[Hi];
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
  return (1-t)*v1 + t*v2;
}

export function blend(v1: number, v2: number, isMin: boolean, smoothness: number, weight: number): number {
  let s = isMin? -1: 1;
  let h = 0.5 - s*0.5*clamp((v2-v1) / smoothness, -1.0, 1.0);
  h = Math.pow(h, 1/weight);
  let d = smoothness*h*(1.0-h); // > mix(v2,v1,h)-min(v2,v1)
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
