import {Vec3, Quaternion} from '@tsgl/util';
import * as rand from '@tsgl/random';
import * as glEntities from '@tsgl/gl_entity';
import * as shapes from '@tsgl/shapes';
import * as shapeFBM from '@tsgl/shapeFBM'
import * as materials from '@tsgl/materials';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import * as drawables from '@tsgl/drawables';
import {TimeTicks} from './event_stream';


export class TestTexture extends textures.ConstantTexture {
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

export class CornellBox extends drawables.Group {
  constructor() {
    let walls = [
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.ConstantTexture(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.ConstantTexture(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,-2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.ConstantTexture(new Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,0,-2))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.ConstantTexture(new Vec3(0,1,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(2,0,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.ConstantTexture(new Vec3(1,0,0), 0.5, 5),
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
      new textures.ConstantTexture(new Vec3(0,0,1), 0.5, 10),
      new reflectances.Phong()
    );
    let drawable = new drawables.MaterializedShape(shape, material);
    let transform = new glEntities.Transform(1, Quaternion.identity(), new Vec3(3,0,0));
    super(drawable, transform);
    t.addEventListener(()=>{
      transform.translate = transform.translate.rotate(Quaternion.fromAngleAxis(Math.PI/30, new Vec3(0,1,0)));
    });
  }
}
export class RotatingRoundedCube extends drawables.Transformed {
  constructor(t: TimeTicks) {
    let org = new drawables.MaterializedShape(
      new shapes.SmoothUnion(
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
      ),
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
