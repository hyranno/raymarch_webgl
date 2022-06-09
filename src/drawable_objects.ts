import * as util from '@tsgl/util';
import * as rand from '@tsgl/random';
import * as glEntities from '@tsgl/gl_entity';
import * as fields from '@tsgl/scalar_fields';
import * as v3fields from '@tsgl/vec3_fields';
import * as shapes from '@tsgl/shapes';
import * as shapeFBM from '@tsgl/shapeFBM'
import * as materials from '@tsgl/materials';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import * as drawables from '@tsgl/drawables';
import {GlClosure} from '@tsgl/gl_closure';
import {TexturePatch, GlVec3, GlQuaternion, Transform} from '@tsgl/gl_types';
import {TimeTicks} from './event_stream';


export class TestTexture extends textures.Constant {
  override GlFunc_get(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        value_${this.id}.albedo + mix(0.0,1.0, 0.5<point.x) * vec3(1, 0, 0),
        value_${this.id}.roughness, value_${this.id}.specular,
        point, normal
      );
    }
  `;}
}
export class TestTexture2 extends textures.Texture {
  tex: GlClosure<TexturePatch, [GlVec3, GlVec3]>;
  constructor() {
    super();
    let tex_constant = new textures.Constant(new util.Vec3(0.5,0.5,0.5), 0.7, 10);
    let rand_normal = new rand.Normal();
    let local_field = new fields.CircularyZeroSum();
    let tex_fbm = new textures.FieldDefined(
      new v3fields.FractionalBrownianMotion(0.3, 4, util.Simplex3Coord.Simplex3Center.mul(1/2),
        new v3fields.SimplexInterpolation(
          new v3fields.FromHSV(
            new fields.Random(new rand.Mult(new rand.Uniform(), [new rand.Constant(2*Math.PI)])),
            new fields.Random(new rand.Add(new rand.Mult(new rand.Normal(), [new rand.Constant(0.2)]), [new rand.Constant(0.1)])),
            new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.2)]))
          ), local_field
        )
      ),
      new fields.FractionalBrownianMotion(0.3, 4, util.Simplex3Coord.Simplex3Center.mul(1/2),
        new fields.SimplexInterpolation(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), local_field)
      ),
      new fields.FractionalBrownianMotion(0.3, 4, util.Simplex3Coord.Simplex3Center.mul(1/2),
        new fields.SimplexInterpolation(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(2)])), local_field)
      )
    );
    let tex_cell = new textures.FieldDefined(
      new v3fields.FromHSV(
        new fields.Constant(0),
        new fields.Constant(0),
        new fields.SmoothClamp(
          new fields.Add(
            new fields.VoronoiEdgeSimplex(new v3fields.FromPolar(
              new fields.Random(new rand.Constant(0.1)),
              new fields.Random(new rand.Mult(new rand.Uniform(), [new rand.Constant(2*Math.PI)])),
              new fields.Random(new rand.Mult(new rand.Add(new rand.Uniform(), [new rand.Constant(-0.5)]), [new rand.Constant(2*Math.PI)])),
            )), [new fields.Constant(-0.1)]
          ),
          -0.5, 0, 0
        )
      ), new fields.Constant(0), new fields.Constant(0)
    );
    this.tex = new textures.Add(tex_constant, [tex_cell]); //new textures.Add(tex_constant, [tex_fbm]);
    this.dependentGlEntities.push(this.tex);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return ${this.tex.glFuncName}(point, normal);
    }
  `;}
}

export class CornellBox extends drawables.Group {
  constructor() {
    let walls = [
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,-2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,0,-2))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(0,1,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(2,0,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,0,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(-2,0,0))
      ),
    ];
    super(walls);
  }
}

export class OrbitingSphere extends drawables.Transformed {
  constructor(t: TimeTicks) {
    let sphere = new shapes.FromSdfClosure( new shapes.Sphere() );
    let shape = new shapes.BoundingShape(
      new shapeFBM.SubtractBrownianMotion(
        sphere, new rand.Constant(0.5), 0.3, 0.1, 0.5
      ),
      sphere,
      0.1
    );
    let material = new materials.TextureReflectanceModel(
      new TestTexture2(), //new textures.Constant(new util.Vec3(0,0,1), 0.5, 10),
      new reflectances.Phong()
    );
    let drawable = new drawables.MaterializedShape(
      sphere, //shape,
      material
    );
    let transform = new Transform(1, util.Quaternion.identity(), new util.Vec3(3,0,0));
    super(drawable, transform);
    t.addEventListener(()=>{
      transform.translate = transform.translate.rotate(util.Quaternion.fromAngleAxis(Math.PI/30, new util.Vec3(0,1,0)));
    });
  }
}
export class RotatingRoundedCube extends drawables.Transformed {
  constructor(t: TimeTicks) {
    let shape = new shapes.SmoothUnion(
      new shapes.SmoothSubtraction(
        new shapes.Bloated( new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(0.4,0.4,0.4)) ), 0.3 ),
        [new shapes.Repetition(
          new shapes.Hollowed(new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(0.06,0.06,2)) ), 0.01),
          new util.Vec3(0.3,0.3,1), new util.Vec3(1,1,0)
        )],
        0.1
      ),
      [new shapes.Transformed(
        new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,1)) ),
        new Transform( 0.2, util.Quaternion.fromAngleAxis(0, new util.Vec3(1,0,0)), new util.Vec3(0.4,0.7,0.3) )
      )],
      0.1
    );
    let org = new drawables.MaterializedShape(
      new shapes.Bloated( new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(0.4,0.4,0.4)) ), 0.3 ), //shape,
      new materials.TextureReflectanceModel(
        new TestTexture(new util.Vec3(0,1,0), 0.8, 20),
        new reflectances.Phong()
      )
    );
    let transform = new Transform(
      1,
      util.Quaternion.fromSrcDest((new util.Vec3(1,1,1)).normalize(), new util.Vec3(0,1,0)),
      new util.Vec3(0,0,0)
    );
    super(org, transform);
    let angular_velocity = util.Quaternion.fromAngleAxis(-Math.PI/20, new util.Vec3(0,1,0));
    t.addEventListener(()=>{
      transform.rotation = angular_velocity.mul(transform.rotation);
    });
  }
}



class SinX extends fields.ScalarField {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return 0.01*sin(5.0*point.x);
  }`;}
}
export class SwingBox extends drawables.BumpMap {
  constructor(t: TimeTicks) {
    let transform = new Transform(
      3,
      util.Quaternion.identity(),
      new util.Vec3(0,0,0)
    );
    let shape = new shapes.Transformed(
      new shapes.FromSdfClosure( new shapes.Box(new util.Vec3(1,1,0.01)) ),
      transform
    );
    let material = new materials.TextureReflectanceModel(
      new TestTexture2(),
      new reflectances.Phong()
    );
    let d = new drawables.MaterializedShape(shape, material);
    let bump = new fields.Mult(
      new fields.SmoothClamp(
        new fields.Add(
          new fields.VoronoiEdgeSimplex(new v3fields.FromPolar(
            new fields.Random(new rand.Constant(0.1)),
            new fields.Random(new rand.Mult(new rand.Uniform(), [new rand.Constant(2*Math.PI)])),
            new fields.Random(new rand.Mult(new rand.Add(new rand.Uniform(), [new rand.Constant(-0.5)]), [new rand.Constant(2*Math.PI)])),
          )), [new fields.Constant(-0.1)]
        ),
        -0.5, 0, 0.2
      ), [new fields.Constant(0.05)]
    );
    super(d, bump);
    t.addEventListener(()=>{
      transform.translate = new util.Vec3(0,0, 2*Math.sin(Date.now()/1000/2));
    });
  }
}
