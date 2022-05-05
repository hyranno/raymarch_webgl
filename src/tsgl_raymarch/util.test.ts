import * as util from '@tsgl/util';

test('', () => {});

describe('Vec2D', () => {
  let v1 = new util.Vec2D(1,2);
  let v2 = new util.Vec2D(3,4);
  test('add', () => {
    let v = v1.add(v2);
    expect(v).toEqual(new util.Vec2D(4,6));
  });
  test('dot', () => {
    let v = v1.dot(v2);
    expect(v).toEqual(11);
  });
  test('normalize', () => {
    let v = v1.normalize().len();
    expect(v).toBeCloseTo(1);
  });
});

describe('Vec3D', () => {
  let v1 = new util.Vec3D(1,2,3);
  let v2 = new util.Vec3D(3,4,5);
  test('add', () => {
    let v = v1.add(v2);
    expect(v).toEqual(new util.Vec3D(4,6,8));
  });
  test('dot', () => {
    let v = v1.dot(v2);
    expect(v).toEqual(26);
  });
  test('cross', () => {
    let v1 = new util.Vec3D(1,0,0);
    let v2 = new util.Vec3D(0,2,0);
    expect(v1.cross(v2)).toEqual(new util.Vec3D(0,0,2));
  });
  test('normalize', () => {
    let v = v1.normalize().len();
    expect(v).toBeCloseTo(1);
  });
});

describe('Quaternion', () => {
  test('from angle and axis', () => {
    let v = new util.Vec3D(3,0,0);
    let q = util.Quaternion.fromAngleAxis(Math.PI/2, new util.Vec3D(0,0,1));
    let vr = v.rotate(q);
    expect(vr.x).toBeCloseTo(0);
    expect(vr.y).toBeCloseTo(3);
    expect(vr.z).toBeCloseTo(0);
  });
  test('from src and dest', () => {
    let v1 = new util.Vec3D(2,0,0);
    let v2 = new util.Vec3D(0,2,0);
    let q = util.Quaternion.fromSrcDest(v1,v2);
    let vr = v1.rotate(q);
    expect(vr.x).toBeCloseTo(v2.x);
    expect(vr.y).toBeCloseTo(v2.y);
    expect(vr.z).toBeCloseTo(v2.z);
  });
});

describe('Mat2', () => {
  let m1 = util.Mat2.fromNumbers([[1,2], [3,4]]);
  let m2 = util.Mat2.fromNumbers([[2,3], [4,5]]);
  test('determinant', () => {
    expect(m1.determinant()).toBeCloseTo(-2);
  });
  test('cofactor', () => {
    let m = m1.cofactor();
    let ans = util.Mat2.fromNumbers([[4,-2], [-3,1]]);
    for (let i=0; i<2; i++) {
      for (let j=0; j<2; j++) {
        expect(m[i][j]).toBeCloseTo(ans[i][j]);
      }
    }
  });
  test('inverse', () => {
    let m = m1.mul(m1.inverse());
    let mi = util.Mat2.identity();
    for (let i=0; i<2; i++) {
      for (let j=0; j<2; j++) {
        expect(m[i][j]).toBeCloseTo(mi[i][j]);
      }
    }
  });
  test('mul', () => {
    let m1m2 = m1.mul(m2);
    let ans = util.Mat2.fromNumbers([[10,13], [22,29]]);
    for (let i=0; i<2; i++) {
      for (let j=0; j<2; j++) {
        expect(m1m2[i][j]).toBeCloseTo(ans[i][j]);
      }
    }
  });
  test('mul2x1', () => {
    let v = m1.mul2x1(m2.getCol(0));
    let ans = new util.Vec2D(10,22);
    expect(v.x).toBeCloseTo(ans.x);
    expect(v.y).toBeCloseTo(ans.y);
  });
  test('mulScalar', () => {
    let m = m1.mulScalar(3);
    let ans = util.Mat2.fromNumbers([[3,6], [9,12]]);
    for (let i=0; i<2; i++) {
      for (let j=0; j<2; j++) {
        expect(m[i][j]).toBeCloseTo(ans[i][j]);
      }
    }
  });
});

describe('Mat3', () => {
  let m1 = util.Mat3.fromNumbers([[1,2,3], [3,5,5], [5,3,1]]);
  let m2 = util.Mat3.fromNumbers([[2,3,4], [4,5,1], [7,5,8]]);
  test('determinant', () => {
    expect(m1.determinant()).toBeCloseTo(-14);
  });
  test('inverse', () => {
    let m = m1.mul(m1.inverse());
    let mi = util.Mat3.identity();
    for (let i=0; i<3; i++) {
      for (let j=0; j<3; j++) {
        expect(m[i][j]).toBeCloseTo(mi[i][j]);
      }
    }
  });
  test('mul', () => {
    let m1m2 = m1.mul(m2);
    let ans = util.Mat3.fromNumbers([[31,28,30], [61,59,57], [29,35,31]]);
    for (let i=0; i<3; i++) {
      for (let j=0; j<3; j++) {
        expect(m1m2[i][j]).toBeCloseTo(ans[i][j]);
      }
    }
  });
  test('mul3x1', () => {
    let v = m1.mul3x1(m2.getCol(0));
    let ans = new util.Vec3D(31,61,29);
    expect(v.x).toBeCloseTo(ans.x);
    expect(v.y).toBeCloseTo(ans.y);
    expect(v.z).toBeCloseTo(ans.z);
  });
});


describe('TetrahedronCoord', () => {
  test('fromOrthogonal', () => {
    let vx = util.TetrahedronCoord.fromOrthogonal(new util.Vec3D(+Math.cos(Math.PI/6.0), +Math.sin(Math.PI/6.0), 0));
    let vy = util.TetrahedronCoord.fromOrthogonal(new util.Vec3D(+Math.cos(Math.PI/6.0), -Math.sin(Math.PI/6.0), 0));
    let vz = util.TetrahedronCoord.fromOrthogonal(new util.Vec3D(Math.sqrt(1.0/3.0), 0, Math.sqrt(2.0/3.0)));
    expect(vx.x).toBeCloseTo(1);
    expect(vx.y).toBeCloseTo(0);
    expect(vx.z).toBeCloseTo(0);
    expect(vy.x).toBeCloseTo(0);
    expect(vy.y).toBeCloseTo(1);
    expect(vy.z).toBeCloseTo(0);
    expect(vz.x).toBeCloseTo(0);
    expect(vz.y).toBeCloseTo(0);
    expect(vz.z).toBeCloseTo(1);
  });
  test('toOrthogonal', () => {
    let v = new util.Vec3D(1,2,3);
    let v_ = util.TetrahedronCoord.fromOrthogonal(v).toOrthogonal();
    expect(v_.x).toBeCloseTo(v.x);
    expect(v_.y).toBeCloseTo(v.y);
    expect(v_.z).toBeCloseTo(v.z);
  });
  test('center', () => {
    let tx = (new util.TetrahedronCoord(1,0,0)).toOrthogonal();
    let ty = (new util.TetrahedronCoord(0,1,0)).toOrthogonal();
    let tz = (new util.TetrahedronCoord(0,0,1)).toOrthogonal();
    let c = util.TetrahedronCoord.TetrahedronCenter;
    expect(tx.add(c.negative()).len()).toBeCloseTo(c.len());
    expect(ty.add(c.negative()).len()).toBeCloseTo(c.len());
    expect(tz.add(c.negative()).len()).toBeCloseTo(c.len());
  });
});
