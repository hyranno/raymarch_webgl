import {Vec3, Vec2, Quaternion} from '@tsgl/util';
import {GlEntity} from '@tsgl/gl_entity';
import {GlFloat, GlVec3, GlVec2, Transform} from '@tsgl/gl_types';
import {TsGlClosure} from '@tsgl/tsgl_closure';
import * as tsgl_closure from '@tsgl/tsgl_closure';
import * as tsgl_displacer from '@tsgl/tsgl_displacer';

import * as shapes3d from '@tsgl/shapes';
import * as shapes2d from '@tsgl/shapes2d';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import * as materials from '@tsgl/materials';
import * as drawables from '@tsgl/drawables';

class CircleDeco extends shapes2d.Subtraction {
  constructor() {
    let base: TsGlClosure<GlFloat, [GlVec2]> = new shapes2d.Union(
      new shapes2d.Hollowed(
        new tsgl_closure.Displacement(
          "affine", new shapes2d.Circle(), tsgl_displacer.Affine2D.identity().translate(0.2,0.96).inverse()
        ), 0.06
      ), [
        new shapes2d.Hollowed(new tsgl_closure.Displacement(
          "affine", new shapes2d.Rect(new Vec2(1,0.3)), tsgl_displacer.Affine2D.identity().rotate(-0.26).inverse()
        ), 0.04),
      ]
    );
    let period = 2*Math.PI / 8;
    let displacer: TsGlClosure<GlVec2, [GlVec2]> = new tsgl_closure.Anonymous(
      `displace`, GlVec2.default(), [GlVec2.default()],
      ([point]: [GlVec2]) => {
        let p = point.value
        let r = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
        let a = Math.atan2(p[1], p[0]);
        a = a % period - a/2;
        let x = r*Math.cos(a);
        let y = r*Math.sin(a);
        y = Math.abs(y);
        return new GlVec2(new Vec2(x,y));
      },
      () => `{
        float period = float(${period});
        float r = length(v0);
        float a = atan(v0.y, v0.x);
        a = mod(a, period) - period/2.0;
        float x = r*cos(a);
        float y = r*sin(a);
        y = abs(y);
        return vec2(x,y);
      }`
    );
    let flower = new tsgl_closure.Displacement<GlFloat, GlVec2>("flower", base, displacer);
    super(new shapes2d.Circle(), [flower]);
  }
}
class CenterDeco extends shapes2d.Union {
  constructor() {
    let shape = new shapes2d.Hollowed(
      new tsgl_closure.Displacement<GlFloat, GlVec2>(
        "affine", new shapes2d.Rect(new Vec2(1,1)),
        tsgl_displacer.Affine2D.identity().rotate(Math.PI/4).inverse()
      ), 0.08
    );
    super(shape, [
      new tsgl_closure.Displacement<GlFloat, GlVec2>(
        "affine", shape,
        tsgl_displacer.Affine2D.identity().scale(2/3, 2/3).translate(0, 0.3).inverse()
      ),
      new tsgl_closure.Displacement<GlFloat, GlVec2>(
        "affine", shape,
        tsgl_displacer.Affine2D.identity().scale(2/3, 2/3).translate(0, -0.3).inverse()
      ),
    ]);
  }
}
class LargeDeco extends shapes2d.Union {
  constructor() {
    let shape = new CenterDeco();
    super(shape, [
      new tsgl_closure.Displacement<GlFloat, GlVec2>(
        "affine", shape,
        tsgl_displacer.Affine2D.identity().scale(0.7, 0.7).translate(1.2, 0).inverse()
      ),
      new tsgl_closure.Displacement<GlFloat, GlVec2>(
        "affine", shape,
        tsgl_displacer.Affine2D.identity().scale(0.55, 0.55).translate(2.0, 0).inverse()
      ),
    ]);
  }
}

export class FenceShape extends shapes3d.Transformed {
  constructor() {
    let box = new shapes3d.Box(new Vec3(1.0, 0.2, 0.04));
    let shape = new tsgl_closure.Displacement(
      "displace",
      new shapes3d.Subtraction(box, [
        new shapes3d.Extrusion(
          new tsgl_closure.Displacement<GlFloat, GlVec2>(
            "affine", new CircleDeco(),
            tsgl_displacer.Affine2D.identity().scale(0.125, 0.125).translate(0.4, -0.02).inverse()
          ), new GlFloat(1)
        ),
        new shapes3d.Transformed(
          new shapes3d.Extrusion(
            new tsgl_closure.Displacement<GlFloat, GlVec2>(
              "affine", new CenterDeco(),
              tsgl_displacer.Affine2D.identity().scale(0.1, 0.1).inverse()
            ),
            new GlFloat(0.02)
          ), new Transform(1, Quaternion.identity(), new Vec3(0,0,0.04))
        ),
        new shapes3d.Transformed(
          new shapes3d.Extrusion(
            new tsgl_closure.Displacement<GlFloat, GlVec2>(
              "affine", new LargeDeco(),
              tsgl_displacer.Affine2D.identity().scale(0.1,0.1).translate(0.76, -0.02).inverse()
            ),
            new GlFloat(0.02)
          ), new Transform(1, Quaternion.identity(), new Vec3(0,0,0.04))
        )
      ]),
      new tsgl_closure.Anonymous("displace", GlVec3.default(), [GlVec3.default()],
        ([point]: [GlVec3]) => new GlVec3(new Vec3(Math.abs(point.value[0]), point.value[1], Math.abs(point.value[2]))),
        () => `{return vec3(abs(v0.x), v0.y, abs(v0.z));}`
      )
    );
    let bound = new shapes3d.BoundingShape(shape, box, 0.2);
    super(bound, new Transform(1, Quaternion.identity(), new Vec3(0, 0.2, 0)));
  }
}
