import {Vec3} from '@tsgl/util';
import * as util from '@tsgl/util';
import * as materials from '@tsgl/materials';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import {GlFloat, GlVec3} from '@tsgl/gl_types';

import * as rand from '@tsgl/random';
import * as fields from '@tsgl/scalar_fields';
import * as v3fields from '@tsgl/vec3_fields';
import {GlClosure} from '@tsgl/gl_closure';
import * as glClosure from '@tsgl/gl_closure';

let testTexture = new textures.Constant(new Vec3(0.8,0.8,0.8), 0.9, 0.1);
let bump0 = new fields.Constant(0);
let testMaterial = new materials.TextureReflectanceModel(testTexture, new reflectances.Phong());


export class BrickStructure extends materials.BumpMap {
  constructor() {
    let random_uniform = new rand.Uniform();
    let rand_normal = new rand.Normal();
    let rand_exponential = new rand.Exponential();
    let local_field = new fields.CircularyZeroSum();
    let brickSize = v3fields.Affine.identity().scale(1/2.1, 1/0.6, 1/1).scale(5,5,5);

    let cementBaseTexture: textures.Constant = new textures.Constant(
      new Vec3(0.75,0.75,0.75), 0.8, 0.1
    );
    let cementFBMColor =
      new glClosure.Displacement("cementFBM",
        new v3fields.FractionalBrownianMotion(
          0.4, 2, util.Simplex3Coord.Simplex3Center.mul(1/2),
          new v3fields.SimplexInterpolation(
            new v3fields.FromHSV(
              new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(2*Math.PI)])),
              new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_exponential, [new rand.Constant(0.1)])), 0, 1, 0.1),
              new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.4)])), -0.1, 0.1, 0.2)
            ), local_field
          )
        ),
        v3fields.Affine.identity().scale(8, 8, 8)
      )
    ;
    let cementAbsFBM: GlClosure<GlFloat, [GlVec3]> = new fields.Length(cementFBMColor);
    let cementFBMTexture = new textures.FieldDefined(
      cementFBMColor, cementAbsFBM, new fields.Constant(0)
    );
    let cement = cementBaseTexture; //new textures.Add(cementBaseTexture, [cementFBMTexture]);
    let cementBump = new fields.Mult(cementAbsFBM, [new fields.Constant(0.02)]);

    let brickBaseColor = new glClosure.Displacement(
      "getBrickColor",
      new glClosure.Displacement(
        "getBrickColorCubic",
        new v3fields.FromHSV(
          new fields.Add(
            new fields.Constant(0.01),
            [new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(0.05)]))],
          ),
          new fields.Add(
            new fields.Constant(0.5),
            [new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), -0.2, 0.2, 0.1)]
          ),
          new fields.Add(
            new fields.Constant(0.6),
            [new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.2)])), -0.2, 0.2, 0.2)]
          ),
        ),
        new v3fields.VoronoiOrthogonal(
          new glClosure.Constant<GlVec3, [GlVec3]>("zero", new GlVec3(new Vec3(0,0,0)), [GlVec3.default()])
        )
      ),
      brickSize
    );
    let brickBaseTexture = new textures.FieldDefined(
      brickBaseColor,
      new fields.Constant(0.9),
      new fields.Constant(0.1),
    );
    let brickFBMColor =
      new glClosure.Displacement("brickFBM",
        new v3fields.FractionalBrownianMotion(
          0.2, 2, util.Simplex3Coord.Simplex3Center.mul(1/2),
          new v3fields.SimplexInterpolation(
            new v3fields.FromHSV(
              new fields.Random(new rand.Mult(random_uniform, [new rand.Constant(2*Math.PI)])),
              new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_exponential, [new rand.Constant(0.2)])), 0, 1, 0.1),
              new fields.SmoothClamp(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), -0.1, 0.1, 0.2)
            ), local_field
          )
        ),
        v3fields.Affine.identity().scale(16,16,16)
      )
    ;
    let brickFBMTexture = new textures.FieldDefined(
      brickFBMColor, new fields.Constant(0), new fields.Constant(0)
    );
    //brickCrackTexture
    let brick = new textures.Add(
      brickBaseTexture, [brickFBMTexture]
    );
    let brickBump = new fields.Mult(new fields.Length(brickFBMColor), [new fields.Constant(0.01)]);

    let edgeBase = new glClosure.Displacement(
      "brickEdge",
      new fields.VoronoiEdgeOrthogonal(
        new glClosure.Constant<GlVec3, [GlVec3]>("zero", new GlVec3(new Vec3(0,0,0)), [GlVec3.default()])
      ),
      brickSize
    );
    let edgeFBM = new fields.FractionalBrownianMotion(
      0.3, 2, util.Simplex3Coord.Simplex3Center.mul(1/2),
      new fields.SimplexInterpolation(new fields.Random(rand_normal), local_field)
    );
    let edge = new fields.Add(
      new fields.SmoothClamp(
        new fields.Add(
          new fields.Mult(new fields.Constant(8), [edgeBase]),
          [new fields.Mult(new fields.Constant(0.3), [edgeFBM])]
        ), 0.3, 1.3, 0.2
      ), [new fields.Constant(-0.3)]
    );
    let edgeBump = new fields.Mult(new fields.Constant(0.008), [edge]);

    let mixWeight = new fields.SmoothClamp(edge, 0, 1, 0.1);
    let mixedTexture = new glClosure.Mix("texture", "mixTexture", cement, brick, mixWeight);
    let mixedBump = new glClosure.Mix("mixedBump", "mix", cementBump, brickBump, mixWeight);

    let bump = new fields.Add(mixedBump, [edgeBump]);

    let baseMaterial = new materials.TextureReflectanceModel(mixedTexture, new reflectances.Phong());
    super(baseMaterial, edgeBump);
  }
}
