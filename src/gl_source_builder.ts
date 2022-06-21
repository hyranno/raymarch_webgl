import path from 'path';
import fs from 'fs';

import {asTemplate} from '@tsgl/util';
import {TimeTicks} from './event_stream';
import {getRenderTargets} from './render_targets';



const dir = path.join(__dirname, "./tsgl_raymarch/glsl/");
const fragShaderTemplate = [
  'header.glsl',
  'declarations.glsl',
  'types.glsl',
  'util.glsl',
  'random.glsl',
  'coord.glsl',
  'raymarch.glsl',
  'cameras.glsl',
  'drawables.glsl',
  'lights.glsl',
  'simple_ray_trace.fs',
].map((filename) => fs.readFileSync(path.join(dir, filename), 'utf-8')).join("");


let timetick = new TimeTicks(1000 * 1000);
let targets = getRenderTargets(timetick);

targets.drawables.forEach((entity) => entity.clearGlSourceStates());
targets.lights.forEach((entity) => entity.clearGlSourceStates());
targets.cameras.forEach((entity) => entity.clearGlSourceStates());
let fragShaderSource = asTemplate(fragShaderTemplate, targets);

fs.writeFileSync(path.join(__dirname, './mid-build/frag_raw.glsl'), fragShaderSource, 'utf-8');
