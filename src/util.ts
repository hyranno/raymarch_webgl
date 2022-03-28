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
