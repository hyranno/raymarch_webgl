import {Vec3, Quaternion} from '@tsgl/util';
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
import {TimeTicks} from './event_stream';


export class TestTexture extends textures.Constant {
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return TexturePatch(
        albedo_${this.id} + mix(0.0,1.0, 0.5<point.x) * vec3(1, 0, 0),
        roughness_${this.id}, specular_${this.id},
        point, normal
      );
    }
  `;}
}
export class TestTexture2 extends textures.Texture {
  tex: textures.Texture;
  constructor() {
    super();
    let tex_constant = new textures.Constant(new Vec3(0.5,0.5,0.5), 0.7, 10);
    let rand_normal = new rand.Normal();
    let local_field = new fields.CircularyZeroSum();
    let tex_field = new textures.FieldDefined(
      new v3fields.SimplexInterpolation(
        new v3fields.FromHSV(
          new fields.Random(new rand.Mult(new rand.Uniform(), [new rand.Constant(2*Math.PI)])),
          new fields.Random(new rand.Add(new rand.Mult(new rand.Normal(), [new rand.Constant(0.3)]), [new rand.Constant(0.6)])),
          new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.8)]))
        ), local_field
      ),
      new fields.SimplexInterpolation(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(0.1)])), local_field),
      new fields.SimplexInterpolation(new fields.Random(new rand.Mult(rand_normal, [new rand.Constant(2)])), local_field)
    );
    this.tex = tex_constant;//new textures.Add(tex_constant, [tex_field]);
    this.dependentGlEntities.push(this.tex);
  }
  override GlFunc_getTexturePatch(): string {return `
    TexturePatch getTexturePatch_${this.id}(vec3 point, vec3 normal) {
      return getTexturePatch_${this.tex.id}(point, normal);
    }
  `;}
}

export class CornellBox extends drawables.Group {
  constructor() {
    let walls = [
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,-2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,0,-2))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new Vec3(0,1,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(2,0,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new Vec3(1,0,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(-2,0,0))
      ),
    ];
    super(walls);
  }
}

export class OrbitingSphere extends drawables.Transformed {
  constructor(t: TimeTicks) {
    let sphere = new shapes.Sphere();
    let shape = new shapes.BoundingShape(
      new shapeFBM.SubtractBrownianMotion(
        sphere, new rand.Constant(0.5), 0.3, 0.1, 0.5
      ),
      sphere,
      0.1
    );
    let material = new materials.TextureReflectanceModel(
      new TestTexture2(), //new textures.Constant(new Vec3(0,0,1), 0.5, 10),
      new reflectances.Phong()
    );
    let drawable = new drawables.MaterializedShape(
      sphere, //shape,
      material
    );
    let transform = new glEntities.Transform(1, Quaternion.identity(), new Vec3(3,0,0));
    super(drawable, transform);
    t.addEventListener(()=>{
      transform.translate = transform.translate.rotate(Quaternion.fromAngleAxis(Math.PI/30, new Vec3(0,1,0)));
    });
  }
}
export class RotatingRoundedCube extends drawables.Transformed {
  constructor(t: TimeTicks) {
    let shape = new shapes.SmoothUnion(
      new shapes.SmoothSubtraction(
        new shapes.Bloated( new shapes.Box(new Vec3(0.4,0.4,0.4)), 0.3 ),
        new shapes.Repetition(
          new shapes.Hollowed(new shapes.Box(new Vec3(0.06,0.06,2)), 0.01),
          new Vec3(0.3,0.3,1), new Vec3(1,1,0)
        ),
        0.1
      ),
      new shapes.Transformed(
        new shapes.Box(new Vec3(1,1,1)),
        new glEntities.Transform( 0.2, Quaternion.fromAngleAxis(0, new Vec3(1,0,0)), new Vec3(0.4,0.7,0.3) )
      ),
      0.1
    );
    let org = new drawables.MaterializedShape(
      new shapes.Bloated( new shapes.Box(new Vec3(0.4,0.4,0.4)), 0.3 ), //shape,
      new materials.TextureReflectanceModel(
        new TestTexture(new Vec3(0,1,0), 0.8, 20),
        new reflectances.Phong()
      )
    );
    let transform = new glEntities.Transform(
      1,
      Quaternion.fromSrcDest((new Vec3(1,1,1)).normalize(), new Vec3(0,1,0)),
      new Vec3(0,0,0)
    );
    super(org, transform);
    let angular_velocity = Quaternion.fromAngleAxis(-Math.PI/20, new Vec3(0,1,0));
    t.addEventListener(()=>{
      transform.rotation = angular_velocity.mul(transform.rotation);
    });
  }
}



class SinX extends fields.ScalarField {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return sin(5.0*point.x);
  }`;}
}
export class SwingBox extends drawables.NormalMap {
  constructor(t: TimeTicks) {
    let shape = new shapes.Transformed(
      new shapes.Box(new Vec3(1,1,0.01)),
      new glEntities.Transform(
        3,
        Quaternion.identity(),
        new Vec3(0,0,0)
      )
    );
    let material = new materials.TextureReflectanceModel(
      new TestTexture2(),
      new reflectances.Phong()
    );
    let d = new drawables.MaterializedShape(shape, material);
    let local_field = new fields.CircularyZeroSum();
    let q = new fields.SimplexInterpolation(
      new fields.Random(new rand.Mult(new rand.Exponential(), [new rand.Constant(0.1)])), local_field
    );
    let a = new fields.SimplexRotationalInterpolation(
      new fields.Random(new rand.Mult(new rand.Uniform(), [new rand.Constant(2*Math.PI)])), local_field
    );
    super(d, q, a);
    t.addEventListener(()=>{
      shape.transform.translate = new Vec3(0,0, 2*Math.sin(Date.now()/1000/2));
    });
  }
}
