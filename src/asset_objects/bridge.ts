import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as util from '@tsgl/util';
import {GlFloat, GlVec3, Transform} from '@tsgl/gl_types';
import {TsGlClosure} from '@tsgl/tsgl_closure';
import * as tsgl_closure from '@tsgl/tsgl_closure';
import * as rand from '@tsgl/random';
import * as fields from '@tsgl/scalar_fields';
import * as v3fields from '@tsgl/vec3_fields';
import {GlClosure} from '@tsgl/gl_closure';
import * as glClosure from '@tsgl/gl_closure';

import * as shapes from '@tsgl/shapes';
import * as shapes2d from '@tsgl/shapes2d';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import * as materials from '@tsgl/materials';
import * as drawables from '@tsgl/drawables';

import {BrickStructure} from './brick';

let random_uniform = new rand.Uniform();
let rand_normal = new rand.Normal();
let rand_exponential = new rand.Exponential();

let unitLength = 1.4;
let baseScale = 3
let repetitionInterval = 2 * unitLength * baseScale;

export class BridgeBase extends drawables.MaterializedShape {
  constructor(){
    let shape = new shapes.RepetitionInfX(
      new shapes.Subtraction(
        new shapes.Transformed(
          new shapes.Box(new Vec3(unitLength,1,1)),
          new Transform(1, Quaternion.identity(), new Vec3(0,1,0))
        ),
        [
          new shapes.Extrude(new shapes2d.Circle(), new GlFloat(2)),
        ]
      ),
      unitLength * 2
    );
    super(shape, new BrickStructure());
  }
}

export class TiledCylinder extends drawables.MaterializedShape {
  constructor(){
    let shape = new shapes.RepetitionInfX(
      new shapes.Extrude(new shapes2d.Circle(), new GlFloat(3.02)),
      repetitionInterval
    );
    let tileColor = new glClosure.Displacement(
      "displace",
      new glClosure.Displacement(
        "displace",
        new v3fields.FromHSV(
            new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(2*Math.PI)])),
          new fields.Add(
            new fields.Constant(0.5),
            [new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), -0.1, 0.1, 0.1)]
          ),
          new fields.Add(
            new fields.Constant(0.9),
            [new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), -0.1, 0.1, 0.1)]
          ),
        ),
        new v3fields.VoronoiSimplex(
          new v3fields.FromPolar(
            new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_exponential, [new rand.Constant(0.1)])), -0.2, 0.2, 0.1),
            new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(2*Math.PI)])),
            new fields.Random(new rand.Mult(new rand.Add(random_uniform, [new rand.Constant(-0.5)]), [new rand.Constant(Math.PI)])),
          )
        )
      ),
      v3fields.Affine.identity().scale(3,3,3)
    );
    let texture = new textures.FieldDefined(
      tileColor,
      //new v3fields.FromXYZ(new fields.Constant(1),new fields.Constant(1),new fields.Constant(1)),
      new fields.Constant(0.4),
      new fields.Constant(0.5),
    );
    let material = new materials.TextureReflectanceModel(texture, new reflectances.Phong());
    super(shape, material);
  }
}


export class Bridge extends drawables.Group {
  constructor() {
    let base = new drawables.Transformed(new BridgeBase(), new Transform(baseScale, Quaternion.identity(), new Vec3(0,0,0)));
    let tile = new drawables.Transformed(new TiledCylinder(), new Transform(1, Quaternion.identity(), new Vec3(0,4.6,0)));
    super([base, tile]);
  }
}
