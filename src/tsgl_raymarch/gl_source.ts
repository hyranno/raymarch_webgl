import header from '@glsl/header.glsl';
import declarations from '@glsl/declarations.glsl';
import types from '@glsl/types.glsl';
import util from '@glsl/util.glsl';
import rand from '@glsl/random.glsl';
import coord from '@glsl/coord.glsl'
import raymarch from '@glsl/raymarch.glsl';
import cameras from '@glsl/cameras.glsl';
import drawables from '@glsl/drawables.glsl';
import lights from '@glsl/lights.glsl';
import main from '@glsl/simple_ray_trace.fs';

export const fragShaderTemplate = `${header}
  ${declarations}
  ${types}
  ${util}
  ${rand}
  ${coord}
  ${raymarch}
  ${cameras}
  ${drawables}
  ${lights}
  ${main}
`;
