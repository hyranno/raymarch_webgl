import * as util from '@tsgl/util';

test('', () => {});

describe('Vec2', () => {
  let v1 = new util.Vec2(1,2);
  let v2 = new util.Vec2(3,4);
  test('add', () => {
    let v = v1.add(v2);
    expect(v).toEqual(new util.Vec2(4,6));
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

describe('Vec3', () => {
  let v1 = new util.Vec3(1,2,3);
  let v2 = new util.Vec3(3,4,5);
  test('add', () => {
    let v = v1.add(v2);
    expect(v).toEqual(new util.Vec3(4,6,8));
  });
  test('dot', () => {
    let v = v1.dot(v2);
    expect(v).toEqual(26);
  });
  test('cross', () => {
    let v1 = new util.Vec3(1,0,0);
    let v2 = new util.Vec3(0,2,0);
    expect(v1.cross(v2)).toEqual(new util.Vec3(0,0,2));
  });
  test('normalize', () => {
    let v = v1.normalize().len();
    expect(v).toBeCloseTo(1);
  });
});

describe('Quaternion', () => {
  test('from angle and axis', () => {
    let v = new util.Vec3(3,0,0);
    let q = util.Quaternion.fromAngleAxis(Math.PI/2, new util.Vec3(0,0,1));
    let vr = v.rotate(q);
    expect(vr[0]).toBeCloseTo(0);
    expect(vr[1]).toBeCloseTo(3);
    expect(vr[2]).toBeCloseTo(0);
  });
  test('from src and dest', () => {
    let v1 = new util.Vec3(2,0,0);
    let v2 = new util.Vec3(0,2,0);
    let q = util.Quaternion.fromSrcDest(v1,v2);
    let vr = v1.rotate(q);
    expect(vr[0]).toBeCloseTo(v2[0]);
    expect(vr[1]).toBeCloseTo(v2[1]);
    expect(vr[2]).toBeCloseTo(v2[2]);
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
    let ans = new util.Vec2(10,22);
    expect(v[0]).toBeCloseTo(ans[0]);
    expect(v[1]).toBeCloseTo(ans[1]);
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
    let ans = new util.Vec3(31,61,29);
    expect(v[0]).toBeCloseTo(ans[0]);
    expect(v[1]).toBeCloseTo(ans[1]);
    expect(v[2]).toBeCloseTo(ans[2]);
  });
});


describe('Simplex3Coord', () => {
  test('fromOrthogonal', () => {
    let vx = util.Simplex3Coord.fromOrthogonal(new util.Vec3(+Math.cos(Math.PI/6.0), +Math.sin(Math.PI/6.0), 0));
    let vy = util.Simplex3Coord.fromOrthogonal(new util.Vec3(+Math.cos(Math.PI/6.0), -Math.sin(Math.PI/6.0), 0));
    let vz = util.Simplex3Coord.fromOrthogonal(new util.Vec3(Math.sqrt(1.0/3.0), 0, Math.sqrt(2.0/3.0)));
    expect(vx[0]).toBeCloseTo(1);
    expect(vx[1]).toBeCloseTo(0);
    expect(vx[2]).toBeCloseTo(0);
    expect(vy[0]).toBeCloseTo(0);
    expect(vy[1]).toBeCloseTo(1);
    expect(vy[2]).toBeCloseTo(0);
    expect(vz[0]).toBeCloseTo(0);
    expect(vz[1]).toBeCloseTo(0);
    expect(vz[2]).toBeCloseTo(1);
  });
  test('toOrthogonal', () => {
    let v = new util.Vec3(1,2,3);
    let v_ = util.Simplex3Coord.fromOrthogonal(v).toOrthogonal();
    expect(v_[0]).toBeCloseTo(v[0]);
    expect(v_[1]).toBeCloseTo(v[1]);
    expect(v_[2]).toBeCloseTo(v[2]);
  });
  test('center', () => {
    let tx = (new util.Simplex3Coord(1,0,0)).toOrthogonal();
    let ty = (new util.Simplex3Coord(0,1,0)).toOrthogonal();
    let tz = (new util.Simplex3Coord(0,0,1)).toOrthogonal();
    let c = util.Simplex3Coord.Simplex3Center;
    expect(tx.add(c.negative()).len()).toBeCloseTo(c.len());
    expect(ty.add(c.negative()).len()).toBeCloseTo(c.len());
    expect(tz.add(c.negative()).len()).toBeCloseTo(c.len());
  });
  test('neighbors', () => {
    let v = util.Simplex3Coord.asSimplex3Coord( new util.Vec3(1,2,3) );
    let origin = v.toOrthogonal();
    let neighbors = v.neighbors();
    expect(neighbors.shift().toOrthogonal().add(origin.negative()).len()).toBeCloseTo(0);
    neighbors.forEach((v) => {
      expect(v.toOrthogonal().add(origin.negative()).len()).toBeCloseTo(1);
    });
  });
});
