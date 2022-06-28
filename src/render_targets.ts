import {Transform} from '@tsgl/gl_types';
import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as drawables from '@tsgl/drawables';
import * as lights from '@tsgl/lights';
import * as cameras from '@tsgl/cameras';

import {TimeTicks} from './event_stream'
import * as objs from './drawable_objects';
import {CornellBox} from './asset_objects/cornel_box';
import {Bridge} from './asset_objects/bridge';

export class RenderTargets {
  constructor(
    public cameras: cameras.Camera[],
    public drawables: drawables.Drawable[],
    public lights: lights.Light[],
  ) {}
}
export function getRenderTargets(timetick: TimeTicks) {
  let t = 0;
  timetick.addEventListener(()=> {
    t = (t+1) % (1024*1024);
  });

  let camera = new cameras.Perspective(new Vec3(0,4,20), new Vec3(0,0.6,0), new Vec3(0.8,0,0), 1, new Vec2(400,300));
  timetick.addEventListener(()=> {
    let a = t * Math.PI * 2 / timetick.interval;
    camera.position.value = (new Vec3(0,12,0)).add(new Vec3(20*Math.sin(a/2), -6*Math.cos(a), 20*Math.cos(a/2)));
    let qbase = Quaternion.fromXY((new Vec3(0.8,0,0)).normalize(), (new Vec3(0,0.6,0)).normalize());
    let qpitch = Quaternion.fromAngleAxis(-0.3*(-Math.cos(a)+1), new Vec3(1,0,0));
    let qyaw = Quaternion.fromAngleAxis(a/2, new Vec3(0,1,0));
    camera.rotation.value = qbase.mul(qyaw).mul(qpitch);
  });
  let cameras_: cameras.Camera[] = [
    camera,
  ];

  let drawables_: drawables.Drawable[] = [
    /*
    new drawables.Transformed(
      new CornellBox(),
      new Transform( 5, Quaternion.fromAngleAxis(0, new Vec3(1,0,0)), new Vec3(0,0,-2.5) )
    ),
    new objs.OrbitingSphere(timetick),
    new objs.RotatingRoundedCube(timetick),
    new objs.SwingBox(timetick),
    */
    //new objs.RotatingRoundedCube(timetick),
    new Bridge(),
  ];

  let light = new lights.PointLight(new Vec3(0,3,1), new Vec3(1,1,1));
  timetick.addEventListener(()=> {
    let a = t * Math.PI * 2 / timetick.interval;
    light.position.value = (new Vec3(0,2,0)).add(new Vec3(Math.sin(a/2), 0, 2*Math.cos(a/2))).mul(10);
  });
  let lights_: lights.Light[] = [
    //new lights.DirectionalLight((new Vec3(2,-3,-10)).normalize(), new Vec3(1,1,1)),
    light,
  ];

  return new RenderTargets(cameras_, drawables_, lights_);
}
