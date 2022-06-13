import * as util from '@tsgl/util';

test('', () => {});

function Vec3CloseTo(val: util.Vec3, e: util.Vec3) {
  for (let i=0; i<3; i++) {
    expect(val[i]).toBeCloseTo(e[i]);
  }
}
function Mat2CloseTo(val: util.Mat2, e: util.Mat2) {
  for (let i=0; i<2; i++) {
    for (let j=0; j<2; j++) {
      expect(val[i][j]).toBeCloseTo(e[i][j]);
    }
  }
}
function Mat3CloseTo(val: util.Mat3, e: util.Mat3) {
  for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
      expect(val[i][j]).toBeCloseTo(e[i][j]);
    }
  }
}

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
  test('rounds', () => {
    let r = (new util.Vec2(0.5, 0.5)).rounds();
    expect(r).toEqual([
      new util.Vec2(0,0),
      new util.Vec2(1,0),
      new util.Vec2(0,1),
      new util.Vec2(1,1),
    ]);
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
    let v1: util.Vec3, v2: util.Vec3;
    v1 = new util.Vec3(1,0,0);
    v2 = new util.Vec3(0,2,0);
    expect(v1.cross(v2)).toEqual(new util.Vec3(0,0,2));
    v1 = new util.Vec3(1,1,0);
    v2 = new util.Vec3(0,0,1);
    expect(v1.cross(v2)).toEqual(new util.Vec3(1,-1,0));
  });
  test('normalize', () => {
    let v = v1.normalize().len();
    expect(v).toBeCloseTo(1);
  });
  test('rounds', () => {
    let r = (new util.Vec3(0.5, 0.5, 0.5)).rounds();
    expect(r).toEqual([
      new util.Vec3(0,0,0),
      new util.Vec3(1,0,0),
      new util.Vec3(0,1,0),
      new util.Vec3(1,1,0),
      new util.Vec3(0,0,1),
      new util.Vec3(1,0,1),
      new util.Vec3(0,1,1),
      new util.Vec3(1,1,1),
    ]);
  });
});

describe('Quaternion', () => {
  test('from angle and axis', () => {
    let v: util.Vec3, q: util.Quaternion;
    v = new util.Vec3(3,0,0);
    q = util.Quaternion.fromAngleAxis(Math.PI/2, new util.Vec3(0,0,1));
    Vec3CloseTo(v.rotate(q), new util.Vec3(0,3,0));
    v = (new util.Vec3(1,1,0)).normalize();
    q = util.Quaternion.fromAngleAxis(1/4*2*Math.PI, new util.Vec3(1,-1,0));
    Vec3CloseTo(v.rotate(q), new util.Vec3(0,0,1));
  });
  test('from src and dest', () => {
    let v1 = new util.Vec3(2,0,0);
    let v2 = new util.Vec3(0,2,0);
    let q = util.Quaternion.fromSrcDest(v1,v2);
    let vr = v1.rotate(q);
    Vec3CloseTo(vr, v2);
  });
  test('from x and y', () => {
    let vx = new util.Vec3(1,1,0);
    let vy = new util.Vec3(0,0,1);
    let vz = vx.cross(vy);
    let q = util.Quaternion.fromXY(vx,vy);
    Vec3CloseTo(vx.rotate(q).normalize(), new util.Vec3(1,0,0));
    Vec3CloseTo(vy.rotate(q).normalize(), new util.Vec3(0,1,0));
    Vec3CloseTo(vz.rotate(q).normalize(), new util.Vec3(0,0,1));
  });
  test('from x and z', () => {
    let vx = new util.Vec3(1,1,0);
    let vz = new util.Vec3(0,0,1);
    let vy = vx.cross(vz).negative();
    let q = util.Quaternion.fromXZ(vx,vz);
    Vec3CloseTo(vx.rotate(q).normalize(), new util.Vec3(1,0,0));
    Vec3CloseTo(vy.rotate(q).normalize(), new util.Vec3(0,1,0));
    Vec3CloseTo(vz.rotate(q).normalize(), new util.Vec3(0,0,1));
  });
  test('toDCM', () => {
    let v1 = new util.Vec3(2,0,0);
    let v2 = new util.Vec3(0,2,0);
    let q = util.Quaternion.fromSrcDest(v1,v2);
    let vr = q.toDCM().mul3x1(v1);
    Vec3CloseTo(vr, v2);
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
    expect(m).toEqual(ans);
  });
  test('inverse', () => {
    let m = m1.mul(m1.inverse());
    let mi = util.Mat2.identity();
    Mat2CloseTo(m, mi);
  });
  test('mul', () => {
    let m1m2 = m1.mul(m2);
    let ans = util.Mat2.fromNumbers([[10,13], [22,29]]);
    expect(m1m2).toEqual(ans);
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
    expect(m).toEqual(ans);
  });
});

describe('Mat3', () => {
  let m1 = util.Mat3.fromNumbers([[1,2,3], [3,5,5], [5,3,1]]);
  let m2 = util.Mat3.fromNumbers([[2,3,4], [4,5,1], [7,5,8]]);
  test('getCol', () => {
    expect(m1.getCol(0)).toEqual(new util.Vec3(1,3,5));
  });
  test('fromCols', () => {
    let m = util.Mat3.fromCols([m1.getCol(0), m1.getCol(1), m1.getCol(2)]);
    expect(m).toEqual(m1);
  });
  test('determinant', () => {
    expect(m1.determinant()).toBeCloseTo(-14);
  });
  test('inverse', () => {
    let m = m1.mul(m1.inverse());
    let mi = util.Mat3.identity();
    Mat3CloseTo(m,mi);
  });
  test('mul', () => {
    let m1m2 = m1.mul(m2);
    let ans = util.Mat3.fromNumbers([[31,28,30], [61,59,57], [29,35,31]]);
    expect(m1m2).toEqual(ans);
  });
  test('mul3x1', () => {
    let v = m1.mul3x1(m2.getCol(0));
    let ans = new util.Vec3(31,61,29);
    expect(v).toEqual(ans);
  });
});


describe('Simplex3Coord', () => {
  test('fromOrthogonal', () => {
    let vx = util.Simplex3Coord.fromOrthogonal(new util.Vec3(+Math.cos(Math.PI/6.0), +Math.sin(Math.PI/6.0), 0));
    let vy = util.Simplex3Coord.fromOrthogonal(new util.Vec3(+Math.cos(Math.PI/6.0), -Math.sin(Math.PI/6.0), 0));
    let vz = util.Simplex3Coord.fromOrthogonal(new util.Vec3(Math.sqrt(1.0/3.0), 0, Math.sqrt(2.0/3.0)));
    Vec3CloseTo(vx.value, new util.Vec3(1,0,0));
    Vec3CloseTo(vy.value, new util.Vec3(0,1,0));
    Vec3CloseTo(vz.value, new util.Vec3(0,0,1));
  });
  test('toOrthogonal', () => {
    let v = new util.Vec3(1,2,3);
    let v_ = util.Simplex3Coord.fromOrthogonal(v).toOrthogonal();
    Vec3CloseTo(v_, v);
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


test('mix', ()=>{
  expect(util.mix(1,-1, 0)).toEqual(1);
  expect(util.mix(1,-1, 1)).toEqual(-1);
  expect(util.mix(1,-1, 0.5)).toEqual(0);
});

describe('HSV', ()=>{
  test('fromRGB', ()=>{
    expect(util.ColorSpace.RGB2HSV(new util.Vec3(1,1,1))).toEqual(new util.Vec3(0,0,1));
    expect(util.ColorSpace.RGB2HSV(new util.Vec3(0,0,0))).toEqual(new util.Vec3(0,0,0));
    expect(util.ColorSpace.RGB2HSV(new util.Vec3(0.5,0.5,0.5))).toEqual(new util.Vec3(0,0,0.5));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(1,0,0)), new util.Vec3(0/6, 1,1));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(1,1,0)), new util.Vec3(1/6, 1,1));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(0,1,0)), new util.Vec3(2/6, 1,1));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(0,1,1)), new util.Vec3(3/6, 1,1));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(0,0,1)), new util.Vec3(4/6, 1,1));
    Vec3CloseTo(util.ColorSpace.RGB2HSV(new util.Vec3(1,0,1)), new util.Vec3(5/6, 1,1));
  });
  test('toRGB', ()=>{
    expect(util.ColorSpace.HSV2RGB(new util.Vec3(0,0,1))).toEqual(new util.Vec3(1,1,1));
    expect(util.ColorSpace.HSV2RGB(new util.Vec3(0,0,0))).toEqual(new util.Vec3(0,0,0));
    expect(util.ColorSpace.HSV2RGB(new util.Vec3(0,0,0.5))).toEqual(new util.Vec3(0.5,0.5,0.5));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(0/6, 1,1)), new util.Vec3(1,0,0));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(1/6, 1,1)), new util.Vec3(1,1,0));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(2/6, 1,1)), new util.Vec3(0,1,0));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(3/6, 1,1)), new util.Vec3(0,1,1));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(4/6, 1,1)), new util.Vec3(0,0,1));
    Vec3CloseTo(util.ColorSpace.HSV2RGB(new util.Vec3(5/6, 1,1)), new util.Vec3(1,0,1));
  });
});
