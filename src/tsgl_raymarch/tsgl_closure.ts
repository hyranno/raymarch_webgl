import {GlClosure} from './gl_closure';
import {HasGlType, GlAdditive} from './gl_types';
import * as glType from './gl_types';
import * as util from './util';


export abstract class TsGlClosure<R extends HasGlType, A extends HasGlType[]> extends GlClosure<R,A>{
  constructor(glFuncName: string, returnTypedDummy: R, argTypedDummies: A) {
    super(glFuncName, returnTypedDummy, argTypedDummies);
  }
  abstract tsClosure(args: A): R; //(args: TsTupleType<A>): TsType<R>;
}

export class Anonymous<R extends HasGlType, A extends HasGlType[]> extends TsGlClosure<R,A> {
  constructor(glFuncName: string, returnTypedDummy: R, argTypedDummies: A, tsClosure: (args:A)=>R, glFuncBody: ()=>string) {
    super(glFuncName, returnTypedDummy, argTypedDummies);
    this.tsClosure = tsClosure;
    this.GlFunc_get = ()=>{
      return this.getGlFuncDeclaration() + glFuncBody()
    };
  }
  tsClosure: (args: A)=>R;
  GlFunc_get: ()=>string;
}

export class Add<A extends HasGlType & GlAdditive> extends TsGlClosure<A,[A,A]> {
  constructor(glFuncName: string, argTypedDummy: A) {
    super(glFuncName, argTypedDummy, [argTypedDummy, argTypedDummy]);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return add(v0, v1);
    }
  `;}
  override tsClosure(args: [A,A]): A {
    return args[0].add(args[1]);
  }
}

export class Constant<R extends HasGlType, A extends HasGlType[]> extends TsGlClosure<R,A> {
  value: R;
  constructor(glFuncName: string, value: R, argTypedDummies: A) {
    super(glFuncName, value, argTypedDummies);
    this.value = value;
    this.glUniformVars.push({name:"value", value:value});
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return value_${this.id};
    }
  `;}
  override tsClosure(_:A): R {
    return this.value;
  }
}

export class Reduce<R extends HasGlType, A extends HasGlType[]> extends TsGlClosure<R,A> {
  lhs: TsGlClosure<R, A>;
  rhs: TsGlClosure<R, A>[];
  reducer: TsGlClosure<R,[R,R]>;
  constructor(glFuncName: string, reducer: TsGlClosure<R,[R,R]>, lhs: TsGlClosure<R,A>, rhs: TsGlClosure<R,A>[]) {
    super(glFuncName, lhs.returnTypedDummy, lhs.argTypedDummies);
    this.lhs = lhs;
    this.rhs = rhs;
    this.reducer = reducer;
    this.dependentGlEntities.push(reducer, lhs);
    this.dependentGlEntities = this.dependentGlEntities.concat(rhs);
  }
  override GlFunc_get(): string {
    let args = this.argTypedDummies.map((_,i)=>`v${i}`).join(",");
    return `
      ${this.getGlFuncDeclaration()} {
        ${this.returnTypedDummy.getGlTypeString()} res = ${this.lhs.glFuncName}(${args});
        ${this.rhs.map((f)=>`
          res = ${this.reducer.glFuncName}(res, ${f.glFuncName}(${args}));
        `).join("")}
        return res;
      }
    `;
  }
  override tsClosure(args: A): R {
    let res = this.lhs.tsClosure(args);
    this.rhs.forEach((c)=>{res = this.reducer.tsClosure([res, c.tsClosure(args)])});
    return res;
  }
}

export class MulScalar<R extends HasGlType & GlAdditive, A extends HasGlType[]> extends TsGlClosure<R,A> {
  scale: glType.GlFloat;
  v: TsGlClosure<R,A>;
  constructor(glFuncName: string, scale: number, v: TsGlClosure<R,A>) {
    super(glFuncName, v.returnTypedDummy, v.argTypedDummies);
    this.scale = new glType.GlFloat(scale);
    this.v = v;
    this.glUniformVars.push({name:"scale", value:this.scale});
    this.dependentGlEntities.push(v);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return mul(scale_${this.id}, ${this.v.glFuncName}(${this.argTypedDummies.map((_,i)=>`v${i}`).join(",")}));
    }
  `;}
  override tsClosure(args: A): R {
    return this.v.tsClosure(args).mul(this.scale.value);
  }
}

export class Map<R extends HasGlType, A extends HasGlType[]> extends TsGlClosure<R,A> {
  original: TsGlClosure<R,A>;
  mapper: TsGlClosure<R,[R]>;
  constructor(glFuncName: string, original: TsGlClosure<R,A>, mapper: TsGlClosure<R,[R]>) {
    super(glFuncName, original.returnTypedDummy, original.argTypedDummies);
    this.original = original;
    this.mapper = mapper;
    this.dependentGlEntities.push(original, mapper);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return ${this.mapper.glFuncName}( ${this.original.glFuncName}(${this.argTypedDummies.map((_,i)=>`v${i}`).join(",")}) );
    }
  `;}
  override tsClosure(args: A): R {
    return this.mapper.tsClosure( [this.original.tsClosure(args)] );
  }
}
export class Displacement<R extends HasGlType, A extends HasGlType> extends TsGlClosure<R,[A]> {
  original: TsGlClosure<R,[A]>;
  displacer: TsGlClosure<A,[A]>;
  constructor(glFuncName: string, original: TsGlClosure<R,[A]>, displacer: TsGlClosure<A,[A]>) {
    super(glFuncName, original.returnTypedDummy, original.argTypedDummies);
    this.original = original;
    this.displacer = displacer;
    this.dependentGlEntities.push(original, displacer);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return ${this.original.glFuncName}( ${this.displacer.glFuncName}(${this.argTypedDummies.map((_,i)=>`v${i}`).join(",")}) );
    }
  `;}
  override tsClosure(args: [A]): R {
    return this.original.tsClosure( [this.displacer.tsClosure(args)] );
  }
}

export class Transform extends TsGlClosure<glType.GlVec3, [glType.GlVec3]> {
  transform: glType.Transform;
  constructor(transform: glType.Transform) {
    super("transform", glType.GlVec3.default(), [glType.GlVec3.default()]);
    this.transform = transform;
    this.glUniformVars.push({name:"transformParams", value:this.transform});
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return coord_transform(transformParams_${this.id}, v0);
    }
  `;}
  override tsClosure([point]: [glType.GlVec3]): glType.GlVec3 {
    return new glType.GlVec3(this.transform.transform(point.value));
  }
}
export class InverseTransform extends TsGlClosure<glType.GlVec3, [glType.GlVec3]> {
  transform: glType.Transform;
  constructor(transform: glType.Transform) {
    super("transform", glType.GlVec3.default(), [glType.GlVec3.default()]);
    this.transform = transform;
    this.glUniformVars.push({name:"transformParams", value:this.transform});
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return coord_inverse(transformParams_${this.id}, v0);
    }
  `;}
  override tsClosure([point]: [glType.GlVec3]): glType.GlVec3 {
    return new glType.GlVec3(this.transform.inverse(point.value));
  }
}


export class Affine2D extends TsGlClosure<glType.GlVec2, [glType.GlVec2]> {
  mat: glType.GlMat3;
  constructor(mat: glType.GlMat3) {
    super("affine2d", glType.GlVec2.default(), [glType.GlVec2.default()]);
    this.mat = mat;
    this.glUniformVars.push({name:"mat", value:this.mat});
  }
  static identity(): Affine2D {
    return new Affine2D(new glType.GlMat3( util.Mat3.identity() ));
  }
  override GlFunc_get(): string { return `vec2 ${this.glFuncName} (vec2 point) {
    vec3 p = vec3(point, 1);
    vec3 res = mat_${this.id} * p;
    return res.xy;
  }`;}
  override tsClosure([point]: [glType.GlVec2]): glType.GlVec2 {
    let p = new util.Vec3(point.value[0], point.value[1], 1);
    let res = this.mat.value.mul3x1(p);
    return new glType.GlVec2(new util.Vec2(res[0], res[1]));
  }
  map(v: Affine2D): Affine2D {
    return new Affine2D(new glType.GlMat3(this.mat.value.mul(v.mat.value)));
  }
  scale(x: number, y: number): Affine2D {
    let mat = util.Mat3.identity();
    [x,y].forEach((v,i) => {mat[i][i] = v;});
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
  translate(x: number, y: number): Affine2D {
    let mat = util.Mat3.identity();
    [x,y].forEach((v,i) => {mat[i][2] = v;});
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
  rotate(angle: number): Affine2D {
    let mat = util.Mat3.zero();
    mat[0][0] = Math.cos(angle); mat[0][1] = -Math.sin(angle);
    mat[1][0] = Math.sin(angle); mat[1][1] = Math.cos(angle);
    mat[2][2] = 1;
    return (new Affine2D(new glType.GlMat3(mat))).map(this);
  }
}
