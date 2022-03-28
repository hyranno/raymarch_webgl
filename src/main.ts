import {GlRenderer} from './gl_renderer';
import {Drawable, Light, Camera} from './gl_entity';
import {Vec3D} from './util';
import * as shapes from './shapes';
import * as materials from './materials';
import * as lights from './lights';

function main(): void {
  var camera: Camera = new Camera(new Vec3D(0,0,4), new Vec3D(0,0.6,0), new Vec3D(0.8,0,0), 1, 800, 600);
  var drawables: Drawable[] = [
    new Drawable(
      new shapes.Sphere(),
      new materials.Phong(new Vec3D(0.2,0.2,0.2), new Vec3D(0,1.0,0), 0.5, 10)
    ),
  ];
  var light_sources: Light[] = [
    new lights.PointLight(new Vec3D(1,8,1), new Vec3D(1,1,1)),
  ];

  var canvas = document.getElementById("demoscene") as HTMLCanvasElement;
  var gl = canvas.getContext("webgl2");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  var renderer: GlRenderer = new GlRenderer(gl, drawables, light_sources);
  renderer.draw(camera);
}
document.body.onload = main;
