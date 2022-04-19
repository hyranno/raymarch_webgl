import {Vec3D, Quaternion} from '@tsgl/util';
import * as shapes from '@tsgl/shapes';
import * as materials from '@tsgl/materials';
import * as drawables from '@tsgl/drawables';
import {TimeTicks} from './event_stream';


export class TestMaterial extends materials.Phong {
  override GlFunc_getAmbient(): string {
    return `vec3 getAmbient_${this.id} (vec3 point, in Ray view) {
      vec3 color = ambient_${this.id} + coef_isGreater(point.x, 0.5) * vec3(0.1, 0, 0);
      return getAmbient_constant(color);
    }`;
  }
  override GlFunc_getDiffuse(): string {
    return `vec3 getDiffuse_${this.id} (vec3 point, vec3 normal, in Photon photon, in Ray view) {
      vec3 color = diffuse_${this.id} + coef_isGreater(point.x, 0.5) * vec3(1.0, 0, 0);
      return getDiffuse_Phong(color, metalness_${this.id}, normal, photon);
    }`;
  }
}

export class CornellBox extends drawables.Group {
  constructor() {
    var walls = [
      new drawables.Transform(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3D(1,1,1)),
          new materials.Phong((new Vec3D(1,1,1)).mul(0.1), new Vec3D(1,1,1), 0.5, 5)
        ),
        1, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(0,2,0)
      ),
      new drawables.Transform(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3D(1,1,1)),
          new materials.Phong((new Vec3D(1,1,1)).mul(0.1), new Vec3D(1,1,1), 0.5, 5)
        ),
        1, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(0,-2,0)
      ),
      new drawables.Transform(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3D(1,1,1)),
          new materials.Phong((new Vec3D(1,1,1)).mul(0.1), new Vec3D(1,1,1), 0.5, 5)
        ),
        1, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(0,0,-2)
      ),
      new drawables.Transform(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3D(1,1,1)),
          new materials.Phong((new Vec3D(0,1,0)).mul(0.1), new Vec3D(0,1,0), 0.5, 5)
        ),
        1, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(2,0,0)
      ),
      new drawables.Transform(
        new drawables.MaterializedShape(
          new shapes.Box(new Vec3D(1,1,1)),
          new materials.Phong((new Vec3D(1,0,0)).mul(0.1), new Vec3D(1,0,0), 0.5, 5)
        ),
        1, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(-2,0,0)
      ),
    ];
    super(walls);
  }
}

export class OrbitingSphere extends drawables.MaterializedShape {
  constructor(t: TimeTicks) {
    var transform = new shapes.Transform3D(new shapes.Sphere(), 1, new Quaternion(new Vec3D(1,0,0), 0), new Vec3D(3,0,0));
    super(
      transform,
      new materials.Phong(new Vec3D(0.1, 0.1, 0.2), new Vec3D(0,0,1), 0.5, 10)
    );
    t.addEventListener(()=>{
      transform.translate = transform.translate.rotate(Quaternion.fromAngleAxis(Math.PI/30, new Vec3D(0,1,0)));
    });
  }
}
export class RotatingRoundedCube extends drawables.Transform {
  constructor(t: TimeTicks) {
    var org = new drawables.MaterializedShape(
      new shapes.SmoothUnion(
        new shapes.SmoothSubtraction(
          new shapes.Bloated( new shapes.Box(new Vec3D(0.4,0.4,0.4)), 0.3 ),
          new shapes.Repetition(
            new shapes.Hollowed(new shapes.Box(new Vec3D(0.06,0.06,2)), 0.01),
            new Vec3D(0.3,0.3,1), new Vec3D(1,1,0)
          ),
          0.1
        ),
        new shapes.Transform3D(
          new shapes.Box(new Vec3D(1,1,1)), 0.2, Quaternion.fromAngleAxis(0, new Vec3D(1,0,0)), new Vec3D(0.4,0.7,0.3)
        ),
        0.1
      ),
      new TestMaterial(new Vec3D(0.1, 0.2, 0.1), new Vec3D(0,1,0), 0.2, 20)
    );
    super(
      org, 1, Quaternion.fromSrcDest((new Vec3D(1,1,1)).normalize(), new Vec3D(0,1,0)), new Vec3D(0,0,0)
    );
    var angular_velocity = Quaternion.fromAngleAxis(-Math.PI/20, new Vec3D(0,1,0));
    t.addEventListener(()=>{
      this.transform_shape.rotation = angular_velocity.mul(this.transform_shape.rotation);
    });
  }
}
