import {Vec2} from './util';
import {GlFloat, GlVec2, Transform} from './gl_types';
import {TsGlClosure} from './tsgl_closure';
import * as tsgl_closure from './tsgl_closure';


export abstract class Shape2D extends TsGlClosure<GlFloat, [GlVec2]> {
  constructor(){
    super("getDistance", GlFloat.default(), [GlVec2.default()]);
  }
}

export class Circle extends Shape2D {
  override tsClosure([p]: [GlVec2]): GlFloat {
    return new GlFloat(p.value.len() - 1);
  }
  override GlFunc_get(): string {return `
    ${this.getGlFuncDeclaration()} {
      return length(v0) - 1.0;
    }
  `;}
}

export class Rect extends Shape2D {
  size: GlVec2;
  constructor(size: Vec2){
    super();
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

export class Union extends tsgl_closure.Reduce<GlFloat, [GlVec2]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec2]>, rhs: TsGlClosure<GlFloat, [GlVec2]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `union`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.min(args[0].value, args[1].value) ),
      () => `{return min(v0, v1);}`
    );
    super("reduce", reducer, lhs, rhs);
  }
}
export class Subtraction extends tsgl_closure.Reduce<GlFloat, [GlVec2]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec2]>, rhs: TsGlClosure<GlFloat, [GlVec2]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `subtraction`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, -args[1].value) ),
      () => `{return max(v0, -v1);}`
    );
    super("reduce", reducer, lhs, rhs);
  }
}
export class Intersection extends tsgl_closure.Reduce<GlFloat, [GlVec2]> {
  constructor(lhs: TsGlClosure<GlFloat, [GlVec2]>, rhs: TsGlClosure<GlFloat, [GlVec2]>[]) {
    let reducer: TsGlClosure<GlFloat, [GlFloat, GlFloat]> = new tsgl_closure.Anonymous(
      `intersection`, GlFloat.default(), [GlFloat.default(), GlFloat.default()],
      (args: [GlFloat, GlFloat]) => new GlFloat( Math.max(args[0].value, args[1].value) ),
      () => `{return max(v0, v1);}`
    );
    super("reduce", reducer, lhs, rhs);
  }
}

export class Bloated extends tsgl_closure.Map<GlFloat, [GlVec2]> {
  radius: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec2]>, radius: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(distance.value - this.radius.value),
      () => `{return v0 - radius_${this.id};}`
    );
    super("bloat", original, mapper);
    this.radius = new GlFloat(radius);
    this.glUniformVars.push({name:"radius", value:this.radius});
  }
}
export class Hollowed extends tsgl_closure.Map<GlFloat, [GlVec2]> {
  thickness: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec2]>, thickness: number) {
    let mapper: TsGlClosure<GlFloat, [GlFloat]> = new tsgl_closure.Anonymous(
      `map`, GlFloat.default(), [GlFloat.default()],
      ([distance]: [GlFloat]) => new GlFloat(Math.abs(distance.value) - this.thickness.value),
      () => `{return abs(v0) - thickness_${this.id};}`
    );
    super("hull", original, mapper);
    this.thickness = new GlFloat(thickness);
    this.glUniformVars.push({name:"thickness", value:this.thickness});
  }
}
