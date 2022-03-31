import {Drawable} from '@tsgl/gl_entity';
import {Vec3D, Quaternion} from '@tsgl/util';
import * as shapes from '@tsgl/shapes';
import * as materials from '@tsgl/materials';
import {TimeTicks} from './event_stream'


export class OrbitingSphere extends Drawable {
  constructor(t: TimeTicks) {
    var transform = new shapes.Transform3D(new shapes.Sphere(), 1, new Quaternion(new Vec3D(1,0,0), 0), new Vec3D(3,0,0));
    super(
      transform,
      new materials.Phong(new Vec3D(0.1, 0.1, 0.2), new Vec3D(0,0,1), 0.5, 10)
    );
    t.addEventListener(()=>{
      transform.translate = transform.translate.rotate(Quaternion.fromAngleAxis(Math.PI/30, new Vec3D(0,1,0)));
    });
  }
}
export class RotatingRoundedCube extends Drawable {
  constructor(t: TimeTicks) {
    var transform = new shapes.Transform3D(
      new shapes.Bloated(
        new shapes.Box(new Vec3D(0.7,0.7,0.7)), 0.3
      ), 1, Quaternion.fromSrcDest((new Vec3D(1,1,1)).normalize(), new Vec3D(0,1,0)), new Vec3D(0,0,0)
    );
    super(
      transform,
      new materials.Phong(new Vec3D(0.1, 0.2, 0.1), new Vec3D(0,1,0), 0.2, 20)
    );
    t.addEventListener(()=>{
      transform.rotation = Quaternion.fromAngleAxis(-Math.PI/20, new Vec3D(0,1,0)).mul(transform.rotation);
    });
  }
}
