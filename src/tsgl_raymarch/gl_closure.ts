import {GlEntity} from './gl_entity';
import {HasGlType, GlAdditive, GlFloat, TsType, TsTupleType} from './gl_types';


export abstract class GlClosure<R extends HasGlType, A extends HasGlType[]> extends GlEntity {
  readonly argTypedDummies: A;
  readonly returnTypedDummy: R;
  readonly glFuncName: string;
  constructor(glFuncName: string, returnTypedDummy: R, argTypedDummies: A) {
    super();
    this.returnTypedDummy = returnTypedDummy;
    this.argTypedDummies = argTypedDummies;
    this.glFuncName = `${glFuncName}_${this.id}`;
  }
  getGlFuncDeclaration(): string { return `
    ${this.returnTypedDummy.getGlTypeString()} ${this.glFuncName}(${this.argTypedDummies.map((v,i)=>`${v.getGlTypeString()} v${i}`).join(",")})
  `;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    ${this.getGlFuncDeclaration()};
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_get()}
  `;}
  abstract GlFunc_get(): string;
}

export abstract class HeteroTsGlClosure<R extends HasGlType, A extends HasGlType[]> extends GlClosure<R,A> {
  abstract tsClosure(args: TsTupleType<A>): TsType<R>;
  constructor(glFuncName: string, returnTypedDummy: R, argTypedDummies: A) {
    super(glFuncName, returnTypedDummy, argTypedDummies);
  }
}

export class Add<A extends HasGlType & GlAdditive> extends GlClosure<A,[A,A]> {
  constructor(glFuncName: string, argTypedDummy: A) {
    super(glFuncName, argTypedDummy, [argTypedDummy, argTypedDummy]);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return add(v0, v1);
    }
  `;}
}
export class Mult<A extends HasGlType> extends GlClosure<A,[A,A]> {
  constructor(glFuncName: string, argTypedDummy: A) {
    super(glFuncName, argTypedDummy, [argTypedDummy, argTypedDummy]);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return v0 * v1;
    }
  `;}
}

export class Constant<R extends HasGlType, A extends HasGlType[]> extends GlClosure<R,A> {
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
}
export class Reduce<R extends HasGlType, A extends HasGlType[]> extends GlClosure<R,A> {
  lhs: GlClosure<R, A>;
  rhs: GlClosure<R, A>[];
  reducer: GlClosure<R,[R,R]>;
  constructor(glFuncName: string, reducer: GlClosure<R,[R,R]>, lhs: GlClosure<R,A>, rhs: GlClosure<R,A>[]) {
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
}
export class MulScalar<R extends HasGlType, A extends (HasGlType & GlAdditive)[]> extends GlClosure<R,A> {
  scale: GlFloat;
  v: GlClosure<R,A>;
  constructor(glFuncName: string, scale: number, v: GlClosure<R,A>) {
    super(glFuncName, v.returnTypedDummy, v.argTypedDummies);
    this.scale = new GlFloat(scale);
    this.glUniformVars.push({name:"scale", value:this.scale});
    this.dependentGlEntities.push(v);
  }
  override GlFunc_get(): string { return `
    ${this.getGlFuncDeclaration()} {
      return mul(scale_${this.id}, ${this.v.glFuncName}(${this.argTypedDummies.map((_,i)=>`v${i}`).join(",")}));
    }
  `;}
}
