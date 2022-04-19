import {GlRenderer} from '@tsgl/gl_renderer';
import {Drawable, Light, Camera} from '@tsgl/gl_entity';
import {Vec2D, Vec3D, Quaternion} from '@tsgl/util';
import * as drawables from '@tsgl/drawables';
import * as lights from '@tsgl/lights';
import * as cameras from '@tsgl/cameras';

import {TimeTicks} from './event_stream'
import * as objs from './drawable_objects';

function main(): void {
  var timetick = new TimeTicks(1000 * 1/30);
  var cameras_: Camera[] = [
    new cameras.Perspective(new Vec3D(0,0,14), new Vec3D(0,0.6,0), new Vec3D(0.8,0,0), 1, new Vec2D(800, 600)),
  ];
  var drawables_: Drawable[] = [
    new drawables.Transform(
      new objs.CornellBox(),
      5, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(0,0,-2.5)
    ),
    new objs.OrbitingSphere(timetick),
    new objs.RotatingRoundedCube(timetick),
  ];
  var lights_: Light[] = [
    new lights.PointLight(new Vec3D(0,3,1), new Vec3D(1,1,1)),
    //new lights.PointLight(new Vec3D(0,-3,0), (new Vec3D(1,1,1)).mul(0.05)),
  ];

  var canvas = document.getElementById("demoscene") as HTMLCanvasElement;
  var gl = canvas.getContext("webgl2");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  var renderer: GlRenderer = new GlRenderer(gl, cameras_, drawables_, lights_);
  timetick.addEventListener(()=>{
    renderer.draw(0);
  });

  timetick.start();
}
document.body.onload = main;
