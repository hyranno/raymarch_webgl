import {GlRenderer} from '@tsgl/gl_renderer';
import {Transform} from '@tsgl/gl_entity';
import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as drawables from '@tsgl/drawables';
import * as lights from '@tsgl/lights';
import * as cameras from '@tsgl/cameras';

import {TimeTicks} from './event_stream'
import * as objs from './drawable_objects';

function main(): void {
  console.log("initializing script");

  let timetick = new TimeTicks(1000 * 1/20);
  let cameras_: cameras.Camera[] = [
    new cameras.Perspective(new Vec3(0,0,14), new Vec3(0,0.6,0), new Vec3(0.8,0,0), 1, new Vec2(800, 600)),
  ];
  let drawables_: drawables.Drawable[] = [
    new drawables.Transformed(
      new objs.CornellBox(),
      new Transform( 5, Quaternion.fromAngleAxis(0, new Vec3(1,0,0)), new Vec3(0,0,-2.5) )
    ),
    new objs.OrbitingSphere(timetick),
    new objs.RotatingRoundedCube(timetick),
    /*
    new objs.SwingBox(timetick),
    */
  ];
  let lights_: lights.Light[] = [
    //new lights.DirectionalLight((new Vec3(2,-3,-10)).normalize(), new Vec3(1,1,1)),
    new lights.PointLight(new Vec3(0,3,1), new Vec3(1,1,1)),
    //new lights.PointLight(new Vec3(0,-3,0), (new Vec3(1,1,1)).mul(0.05)),
  ];

  let canvas = document.getElementById("demoscene") as HTMLCanvasElement;
  let gl = canvas.getContext("webgl2");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  let renderer: GlRenderer = new GlRenderer(gl, cameras_, drawables_, lights_);
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
