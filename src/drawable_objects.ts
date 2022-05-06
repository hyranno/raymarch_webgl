import {Vec3, Quaternion} from '@tsgl/util';
import * as rand from '@tsgl/random';
import * as glEntities from '@tsgl/gl_entity';
import * as shapes from '@tsgl/shapes';
import * as shapeFBM from '@tsgl/shapeFBM'
import * as materials from '@tsgl/materials';
import * as drawables from '@tsgl/drawables';
import {TimeTicks} from './event_stream';


export class TestMaterial extends materials.Phong {
  override GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      vec3 color = ambient_${this.id} + mix(0.0,1.0, 0.5<point.x) * vec3(0.1, 0, 0);
      return getAmbient_constant(color);
    }`;
  }
  override GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 color = diffuse_${this.id} + mix(0.0,1.0, 0.5<point.x) * vec3(1.0, 0, 0);
      return getDiffuse_Phong(color, metalness_${this.id}, normal, photon);
    }`;
  }
}

export class CornellBox extends drawables.Group {
  constructor() {
    let walls = [
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.Phong((new Vec3(1,1,1)).mul(0.1), new Vec3(1,1,1), 0.5, 5)
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.Phong((new Vec3(1,1,1)).mul(0.1), new Vec3(1,1,1), 0.5, 5)
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,-2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.Phong((new Vec3(1,1,1)).mul(0.1), new Vec3(1,1,1), 0.5, 5)
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(0,0,-2))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.Phong((new Vec3(0,1,0)).mul(0.1), new Vec3(0,1,0), 0.5, 5)
        ),
        new glEntities.Transform(1, Quaternion.identity(), new Vec3(2,0,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3(1,1,1)),
          new materials.Phong((new Vec3(1,0,0)).mul(0.1), new Vec3(1,0,0), 0.5, 5)
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
    let material = new materials.Phong(new Vec3(0.1, 0.1, 0.2), new Vec3(0,0,1), 0.5, 10);
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
      new TestMaterial(new Vec3(0.1, 0.2, 0.1), new Vec3(0,1,0), 0.2, 20)
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
