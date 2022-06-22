import {GlFloat, GlVec2} from './gl_types';
import {TsGlClosure} from './tsgl_closure';


export class Circle extends TsGlClosure<GlFloat, [GlVec2]> {
  constructor(){
    super("getDistance", GlFloat.default(), [GlVec2.default()]);
  }
  override tsClosure([p]: [GlVec2]): GlFloat {
    return new GlFloat(p.value.len() - 1);
  }
  override GlFunc_get(): string {return `
    ${this.getGlFuncDeclaration()} {
      return length(v0) - 1.0;
    }
  `;}
}
