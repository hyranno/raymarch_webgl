import {GlRandom} from './random';
import {GlEntity, Transform} from './gl_entity';

export abstract class ScalarField extends GlEntity {
  abstract GlFunc_get(): string;
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float get_${this.id} (vec3 point);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_get()}
  `;}
}

export class Constant extends ScalarField {
  value: number;
  constructor(value: number) {
    super();
    this.value = value;
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return value_${this.id};
  }`;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float value_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `value_${this.id}`, this.value);
  }
}

export abstract class Reduce extends ScalarField {
  lhs: ScalarField;
  rhs: ScalarField[];
  constructor(lhs: ScalarField, rhs: ScalarField[]) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
    this.dependentGlEntities.push(lhs);
    this.dependentGlEntities = this.dependentGlEntities.concat(rhs);
  }
}
export class Add extends Reduce {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float res = get_${this.lhs.id}(point);
    ${this.rhs.map((f)=>`
      res += get_${f.id}(point);
    `).join("")}
    return res;
  }`;}
}
export class Mult extends Reduce {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float res = get_${this.lhs.id}(point);
    ${this.rhs.map((f)=>`
      res *= get_${f.id}(point);
    `).join("")}
    return res;
  }`;}
}

export class CircularyZeroSum extends ScalarField {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float r = clamp(length(point), 0.0, 1.0);
    float[5] c = float[](1.0, 0.0, -12.0, 20.0, -9.0);
    return +c[4]*r*r*r*r +c[3]*r*r*r +c[2]*r*r +c[1]*r +c[0];
  }`;}
}
export class SphericalyZeroSum extends ScalarField {
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float r = clamp(length(point), 0.0, 1.0);
    float[5] c = float[](1.0, 0.0, -10.0, 16.0, -7.0);
    return +c[4]*r*r*r*r +c[3]*r*r*r +c[2]*r*r +c[1]*r +c[0];
  }`;}
}

export class Transformed extends ScalarField {
  original: ScalarField;
  transform: Transform;
  constructor(original: ScalarField, transform: Transform) {
    super();
    this.original = original;
    this.transform = transform;
    this.dependentGlEntities.push(original, transform);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return get_${this.original.id}( inverse_${this.transform.id}(point) );
  }`;}
}

export class Random extends ScalarField {
  rand: GlRandom;
  constructor(rand: GlRandom) {
    super();
    this.rand = rand;
    this.dependentGlEntities.push(rand);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    uint state;
    PCG16_init(hash32(point), state);
    return rand_${this.rand.id}(state);
  }`;}
}

export class SimplexInterpolation extends ScalarField {
  discrete: ScalarField;
  localField: ScalarField;
  constructor(discrete: ScalarField, localField: ScalarField) {
    super();
    this.discrete = discrete;
    this.localField = localField;
    this.dependentGlEntities.push(discrete, localField);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float res = 0.0;
    vec3[13] origins = simplex3_neighbors( coord_OrthogonalToSimplex3(point) );
    for (int i=0; i<origins.length(); i++) {
      vec3 p = coord_Simplex3ToOrthogonal(origins[i]);
      float val = get_${this.discrete.id}(p);
      res += val * get_${this.localField.id}( point - p );
    }
    return res;
  }`;}
}
export class SimplexRotationalInterpolation extends ScalarField {
  discrete: ScalarField;
  localField: ScalarField;
  constructor(discrete: ScalarField, localField: ScalarField) {
    super();
    this.discrete = discrete;
    this.localField = localField;
    this.dependentGlEntities.push(discrete, localField);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float res_cos=0.0, res_sin=0.0;
    vec3[13] origins = simplex3_neighbors( coord_OrthogonalToSimplex3(point) );
    for (int i=0; i<origins.length(); i++) {
      vec3 p = coord_Simplex3ToOrthogonal(origins[i]);
      float rad = get_${this.discrete.id}(p) * radians(360.0);
      float weight = get_${this.localField.id}( point - p );
      res_cos += cos(rad) * weight;
      res_sin += sin(rad) * weight;
    }
    return (res_cos==0.0 && res_sin==0.0)? 0.0 : atan(res_sin, res_cos);
  }`;}
}

// export class FractionalBrownianMotion extends ScalarField {}
