import {Vec3, Quaternion} from '@tsgl/util';
import * as util from '@tsgl/util';
import {GlFloat, GlVec3, Transform} from '@tsgl/gl_types';
import {TsGlClosure} from '@tsgl/tsgl_closure';
import * as tsgl_closure from '@tsgl/tsgl_closure';

import * as fields from '@tsgl/scalar_fields';
import * as v3fields from '@tsgl/vec3_fields';
import * as shapes from '@tsgl/shapes';
import * as shapes2d from '@tsgl/shapes2d';
import * as drawables from '@tsgl/drawables';

import {BrickStructure} from './brick';

export class BridgeBase extends drawables.MaterializedShape {
  constructor(){
    let shape = new shapes.RepetitionInfX(
      new shapes.Subtraction(
        new shapes.Transformed(
          new shapes.Box(new Vec3(1.4,1,1)),
          new Transform(1, Quaternion.identity(), new Vec3(0,1,0))
        ),
        [
          new shapes.Extrude(new shapes2d.Circle(), new GlFloat(2)),
        ]
      ),
      1.4 * 2
    );
    super(shape, new BrickStructure());
  }
}
