import * as util from '@tsgl/util';
import * as shapes from '@tsgl/shapes';
import * as materials from '@tsgl/materials';
import * as textures from '@tsgl/textures';
import * as reflectances from '@tsgl/reflectances';
import * as drawables from '@tsgl/drawables';
import {Transform} from '@tsgl/gl_types';

export class CornellBox extends drawables.Group {
  constructor() {
    let walls = [
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new util.Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new util.Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,-2,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
        new shapes.Box(new util.Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(1,1,1), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(0,0,-2))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new util.Vec3(1,1,1)),
          new materials.TextureReflectanceModel(
            new textures.Constant(new util.Vec3(0,1,0), 0.5, 5),
            new reflectances.Phong()
          )
        ),
        new Transform(1, util.Quaternion.identity(), new util.Vec3(2,0,0))
      ),
      new drawables.Transformed(
        new drawables.MaterializedShape(
          new shapes.Box(new util.Vec3(1,1,1)),
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
