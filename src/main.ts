import {GlRenderer} from '@tsgl/gl_renderer';
import {TimeTicks} from './event_stream';
import {getRenderTargets} from './render_targets';

function main(): void {
  console.log("initializing script");

  let timetick = new TimeTicks(1000 * 1/10);
  let targets = getRenderTargets(timetick);

  let canvas = document.getElementById("demoscene") as HTMLCanvasElement;
  canvas.width = targets.cameras[0].resolution.value[0];
  canvas.height = targets.cameras[0].resolution.value[1];
  let gl = canvas.getContext("webgl2");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  let renderer: GlRenderer = new GlRenderer(gl, targets.cameras, targets.drawables, targets.lights);
  timetick.addEventListener(()=>{
    renderer.draw(0);
  });

  console.log("script ready. wait 1s");
  window.setTimeout(
    ()=>timetick.start(),
    1000
  );
}

console.log("script loaded");
document.body.onload = () => window.setTimeout(main, 100);
