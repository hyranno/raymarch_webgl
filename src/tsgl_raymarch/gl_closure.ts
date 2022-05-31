import {GlEntity} from './gl_entity';
import {HasGlType} from './gl_types';


export abstract class GlClosure<R extends HasGlType> extends GlEntity {
  argTypedDummies: HasGlType[];
  returnTypedDummy: R;
  glFuncName: string;
  constructor(returnTypedDummy: R, ...argTypedDummies: HasGlType[]) {
    super();
    this.returnTypedDummy = returnTypedDummy;
    this.argTypedDummies = argTypedDummies;
    this.glFuncName = `get_${this.id}`;
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    ${this.returnTypedDummy.getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies.map((a)=>a.getGlTypeString()).join(",")});
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_get()}
  `;}
  abstract GlFunc_get(): string;
}

export abstract class GlClosure0Args<R extends HasGlType> extends GlClosure<R> {
  constructor(returnTypedDummy: R) {
    super(returnTypedDummy);
  }
}
export abstract class GlClosure1Args<R extends HasGlType, A extends HasGlType> extends GlClosure<R> {
  constructor(returnTypedDummy: R, argTypedDummy: A) {
    super(returnTypedDummy, argTypedDummy);
  }
}
export abstract class GlClosure2Args<R extends HasGlType, A1 extends HasGlType, A2 extends HasGlType> extends GlClosure<R> {
  constructor(returnTypedDummy: R, argTypedDummy1: A1, argTypedDummy2: A2) {
    super(returnTypedDummy, argTypedDummy1, argTypedDummy2);
  }
}

export class Add<A extends HasGlType> extends GlClosure2Args<A,A,A> {
  constructor(argTypedDummy: A) {
    super(argTypedDummy, argTypedDummy, argTypedDummy);
  }
  override GlFunc_get(): string { return `
    ${this.argTypedDummies[0].getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies[0].getGlTypeString()} v1, ${this.argTypedDummies[0].getGlTypeString()} v2) {
      return v1 + v2;
    }
  `;}
}
export class Mult<A extends HasGlType> extends GlClosure2Args<A,A,A> {
  constructor(argTypedDummy: A) {
    super(argTypedDummy, argTypedDummy, argTypedDummy);
  }
  override GlFunc_get(): string { return `
    ${this.argTypedDummies[0].getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies[0].getGlTypeString()} v1, ${this.argTypedDummies[0].getGlTypeString()} v2) {
      return v1 * v2;
    }
  `;}
}

export class Constant1Args<R extends HasGlType, A extends HasGlType> extends GlClosure1Args<R,A> {
  value: R;
  constructor(value: R, argTypedDummy: A) {
    super(value, argTypedDummy);
    this.value = value;
    this.glUniformVars.push({name:"value", value:value});
  }
  override GlFunc_get(): string { return `
    ${this.value.getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies[0].getGlTypeString()} _) {
      return value_${this.id};
    }
  `;}
}
export class Reduce1Args<R extends HasGlType, A extends HasGlType> extends GlClosure1Args<R,A> {
  lhs: GlClosure1Args<R, A>;
  rhs: GlClosure1Args<R, A>[];
  reducer: GlClosure2Args<R,R,R>;
  constructor(reducer: GlClosure2Args<R,R,R>, lhs: GlClosure1Args<R, A>, rhs: GlClosure1Args<R, A>[]) {
    super(lhs.returnTypedDummy, lhs.argTypedDummies[0] as A);
    this.lhs = lhs;
    this.rhs = rhs;
    this.reducer = reducer;
    this.dependentGlEntities.push(reducer, lhs);
    this.dependentGlEntities = this.dependentGlEntities.concat(rhs);
  }
  override GlFunc_get(): string { return `${this.returnTypedDummy.getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies[0].getGlTypeString()} v) {
    ${this.returnTypedDummy.getGlTypeString()} res = ${this.lhs.glFuncName}(v);
    ${this.rhs.map((f)=>`
      res = ${this.reducer.glFuncName}(res, ${f.glFuncName}(v));
    `).join("")}
    return res;
  }`;}
}
