import {GlRenderer} from '@tsgl/gl_renderer';
import {Drawable, Light, Camera} from '@tsgl/gl_entity';
import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as drawables from '@tsgl/drawables';
import * as lights from '@tsgl/lights';
import * as cameras from '@tsgl/cameras';

import {TimeTicks} from './event_stream'
import * as objs from './drawable_objects';

function main(): void {
  console.log("initializing script");

  var timetick = new TimeTicks(1000 * 1/20);
  var cameras_: Camera[] = [
    new cameras.Perspective(new Vec3(0,0,14), new Vec3(0,0.6,0), new Vec3(0.8,0,0), 1, new Vec2(800, 600)),
  ];
  var drawables_: Drawable[] = [
    new drawables.Transform(
      new objs.CornellBox(),
      5, Quaternion.fromAngleAxis(0, new Vec3(1,0,0)), new Vec3(0,0,-2.5)
    ),
    new objs.OrbitingSphere(timetick),
    new objs.RotatingRoundedCube(timetick),
  ];
  var lights_: Light[] = [
    new lights.PointLight(new Vec3(0,3,1), new Vec3(1,1,1)),
    //new lights.PointLight(new Vec3(0,-3,0), (new Vec3(1,1,1)).mul(0.05)),
  ];

  var canvas = document.getElementById("demoscene") as HTMLCanvasElement;
  var gl = canvas.getContext("webgl2");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  var renderer: GlRenderer = new GlRenderer(gl, cameras_, drawables_, lights_);
  timetick.addEventListener(()=>{
    renderer.draw(0);
  });

  console.log("script ready");
  window.setTimeout(
    ()=>timetick.start(),
    3000
  );
}

console.log("script loaded");
document.body.onload = () => window.setTimeout(main, 3000);
