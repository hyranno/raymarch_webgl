import {Transform} from '@tsgl/gl_types';
import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as drawables from '@tsgl/drawables';
import * as lights from '@tsgl/lights';
import * as cameras from '@tsgl/cameras';

import {TimeTicks} from './event_stream'
import * as objs from './drawable_objects';
import {CornellBox} from './asset_objects/cornel_box';
import {BridgeBase, TiledCylinder} from './asset_objects/bridge';

export class RenderTargets {
  constructor(
    public cameras: cameras.Camera[],
    public drawables: drawables.Drawable[],
    public lights: lights.Light[],
  ) {}
}
export function getRenderTargets(timetick: TimeTicks) {
  let cameras_: cameras.Camera[] = [
    new cameras.Perspective(new Vec3(0,0,30), new Vec3(0,0.6,0), new Vec3(0.8,0,0), 1, new Vec2(400,300)),
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
    new objs.RotatingRoundedCube(timetick),
    //new BridgeBase(),
    //new TiledCylinder(),
  ];

  let lights_: lights.Light[] = [
    new lights.DirectionalLight((new Vec3(2,-3,-10)).normalize(), new Vec3(1,1,1)),
    //new lights.PointLight(new Vec3(0,3,1), new Vec3(1,1,1)),
  ];
  return new RenderTargets(cameras_, drawables_, lights_);
}
