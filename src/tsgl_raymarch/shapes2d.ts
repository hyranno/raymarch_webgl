import {Vec2} from './util';
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

export class Rect extends TsGlClosure<GlFloat, [GlVec2]> {
  size: GlVec2;
  constructor(size: Vec2){
    super("getDistance", GlFloat.default(), [GlVec2.default()]);
    this.size = new GlVec2(size);
    this.glUniformVars.push({name:"size", value:this.size});
  }
  override tsClosure([p]: [GlVec2]): GlFloat {
    let d = p.value.map((v)=>Math.abs(v)).add( this.size.value.negative() );
    let negative = Math.min(Math.max(d[0],d[1]), 0);
    let positive = d.map((v)=>Math.max(v,0)).len();
    return new GlFloat(negative + positive);
  }
  override GlFunc_get(): string {return `
    ${this.getGlFuncDeclaration()} {
      vec2 d = abs(v0) - size_${this.id};
      float negative = min(max(d.x, d.y), 0.0);
      float positive = length(max(d,0.0));
      return negative + positive;
    }
  `;}
}
