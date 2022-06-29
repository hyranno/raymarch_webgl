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

import {TimeTicks} from '../event_stream';

export class PoppingShape extends shapes.SmoothUnion {
  constructor(timetick: TimeTicks) {
    let core_transform = new Transform(1, Quaternion.identity(), new Vec3(0,0,0));
    let core = new shapes.Transformed(
      new shapes.Bloated(
        new shapes.Box(new Vec3(0.8,1.8,0.8)),
        0.3
      ),
      core_transform
    );
    let bubble_transforms = [
      new Transform(0.3, Quaternion.identity(), new Vec3(0,0,0)),
      new Transform(0.3, Quaternion.identity(), new Vec3(0,0,0)),
      new Transform(0.3, Quaternion.identity(), new Vec3(0,0,0)),
    ];
    let bubbles = [
      new shapes.Transformed(new shapes.Sphere(), bubble_transforms[0]),
      new shapes.Transformed(new shapes.Sphere(), bubble_transforms[1]),
      new shapes.Transformed(new shapes.Sphere(), bubble_transforms[2]),
    ];
    let t = 0;
    timetick.addEventListener(()=>{
      t = (t+1)%1024;
      let a = t/1024 * 2*Math.PI * 16;
      core_transform.translate = new Vec3(0, Math.sin(a*4), 0);
      core_transform.rotation = Quaternion.fromAngleAxis(a, new Vec3(0,1,0));
      bubble_transforms[0].translate = new Vec3(Math.cos(a), Math.sin(a)+1, Math.sin(a));
      bubble_transforms[1].translate = new Vec3(Math.cos(a*4+1), Math.sin(a*2+1)+1, Math.sin(a*4+1));
      bubble_transforms[2].translate = new Vec3(0.5*(Math.cos(a)+1)*Math.cos(a*8+2), Math.sin(a+2)+1, 0.5*(Math.cos(a)+1)*Math.sin(a*8+2));
    });
    super(core, bubbles, 0.5);
  }
}

export class PoppingThing extends drawables.MaterializedShape {
  constructor(timetick: TimeTicks) {
    super(
      new PoppingShape(timetick),
      new materials.TextureReflectanceModel(
        new textures.Constant(new Vec3(1, 0.2, 0.2), 0.3, 5),
        new reflectances.Phong())
    );
  }
}
