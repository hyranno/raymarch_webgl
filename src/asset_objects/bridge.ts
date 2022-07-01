import {Vec2, Vec3, Quaternion} from '@tsgl/util';
import * as util from '@tsgl/util';
import {GlFloat, GlVec3, Transform} from '@tsgl/gl_types';
import {TsGlClosure} from '@tsgl/tsgl_closure';
import * as tsgl_closure from '@tsgl/tsgl_closure';
import * as tsgl_displacer from '@tsgl/tsgl_displacer';
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
import {FenceShape} from './fence';

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
          new shapes.Extrusion(new shapes2d.Circle(), new GlFloat(2)),
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
      new shapes.Extrusion(new shapes2d.Circle(), new GlFloat(3.1)),
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
            new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_exponential, [new rand.Constant(0.2)])), -0.3, 0.3, 0.1),
            new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(2*Math.PI)])),
            new fields.Random(new rand.Mult(new rand.Add(random_uniform, [new rand.Constant(-0.5)]), [new rand.Constant(Math.PI)])),
          )
        )
      ),
      new tsgl_displacer.InverseTransform(new Transform(1/3, Quaternion.identity(), new Vec3(0,0,0)))
    );
    let texture = new textures.FieldDefined(
      tileColor,
      new fields.Constant(0.4),
      new fields.Constant(0.5),
    );
    let material = new materials.TextureReflectanceModel(texture, new reflectances.Phong());
    super(shape, material);
  }
}

export class Fence extends drawables.MaterializedShape {
  constructor() {
    let shape = new shapes.RepetitionInfX(
      new tsgl_closure.Displacement(
        "displace",
        new shapes.Transformed(
          new FenceShape(),
          new Transform(repetitionInterval/2,Quaternion.identity(),new Vec3(0,0,2.6))),
          new tsgl_closure.Anonymous("displace", GlVec3.default(), [GlVec3.default()],
            ([point]: [GlVec3]) => new GlVec3(new Vec3(point.value[0], point.value[1], Math.abs(point.value[2]))),
            () => `{return vec3(v0.x, v0.y, abs(v0.z));}`
          )
      ),
      repetitionInterval
    );
    let material = new materials.TextureReflectanceModel(
      new textures.Constant(new Vec3(0.9, 0.9, 0.9), 0.8, 0.1),
      new reflectances.Phong(),
    );
    let bump = new fields.FractionalBrownianMotion(
      0.4, 2, util.Simplex3Coord.Simplex3Center.mul(1/2),
      new fields.SimplexInterpolation(
        new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.2)])),
        new fields.CircularyZeroSum()
      )
    );//new materials.BumpMap(material, bump)
    super(shape, material);
  }
}

export class Bridge extends drawables.Group {
  constructor() {
    let base = new drawables.Transformed(new BridgeBase(), new Transform(baseScale, Quaternion.identity(), new Vec3(0,0,0)));
    let tile = new drawables.Transformed(new TiledCylinder(), new Transform(1, Quaternion.identity(), new Vec3(0,4.6,0)));
    let fence = new drawables.Transformed(new Fence(), new Transform(1, Quaternion.identity(), new Vec3(0,6,0)));
    super([base, tile, fence]);
  }
}
