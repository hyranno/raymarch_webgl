import * as util from './util';
import {GlRandom} from './random';
import {GlEntity, Transform} from './gl_entity';
import * as v3fields from '@tsgl/vec3_fields';

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

export class FractionalBrownianMotion extends ScalarField {
  gain: number;
  depth: number;
  offset: util.Vec3;
  layer: ScalarField;
  constructor (gain: number, depth: number, offset: util.Vec3, layer: ScalarField) {
    super();
    this.gain = gain;
    this.depth = depth;
    this.layer = layer;
    this.offset = offset;
    this.dependentGlEntities.push(layer);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    float res = 0.0;
    float a = 1.0;
    vec3 p = point;
    for (int i=0; i < depth_${this.id}; i++) {
      res += a * get_${this.layer.id}(p);
      a *= gain_${this.id};
      p = 2.0*p + offset_${this.id};
    }
    return res;
  }`;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float gain_${this.id};
    uniform int depth_${this.id};
    uniform vec3 offset_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `gain_${this.id}`, this.gain);
    GlEntity.setGlUniformInt(gl, program, `depth_${this.id}`, this.depth);
    GlEntity.setGlUniformVec3(gl, program, `offset_${this.id}`, this.offset);
  }
}


export class VoronoiEdgeSimplex extends ScalarField {
  centerDelta: v3fields.Vec3Field;
  constructor(centerDelta: v3fields.Vec3Field) {
    super();
    this.centerDelta = centerDelta;
    this.dependentGlEntities.push(centerDelta);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    vec3[13] cells = simplex3_neighbors( coord_OrthogonalToSimplex3(point) );
    float[13] distances;
    for (int i=0; i < cells.length(); i++) {
      vec3 planeCell = coord_Simplex3ToOrthogonal(cells[i]);
      vec3 cell = planeCell + get_${this.centerDelta.id}(planeCell);
      distances[i] = length(cell -point);
    }
    int firstMinIndex = 0;
    int secondMinIndex = 1;
    swap(firstMinIndex, secondMinIndex, distances[secondMinIndex] < distances[firstMinIndex]);
    for (int i=1; i < distances.length(); i++) {
      int j = i;
      swap(firstMinIndex, j, distances[j] < distances[firstMinIndex]);
      swap(secondMinIndex, j, distances[j] < distances[secondMinIndex]);
    }
    return distances[secondMinIndex] - distances[firstMinIndex];
  }`;}
}

export class VoronoiEdgeOrthogonal extends ScalarField {
  centerDelta: v3fields.Vec3Field;
  constructor(centerDelta: v3fields.Vec3Field) {
    super();
    this.centerDelta = centerDelta;
    this.dependentGlEntities.push(centerDelta);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    vec3[8] cells = coord_rounds(point);
    float[8] distances;
    int minIndex = 0;
    for (int i=0; i < cells.length(); i++) {
      vec3 planeCell = cells[i];
      vec3 cell = planeCell + get_${this.centerDelta.id}(planeCell);
      distances[i] = length(cell -point);
    }
    int firstMinIndex = 0;
    int secondMinIndex = 1;
    swap(firstMinIndex, secondMinIndex, distances[secondMinIndex] < distances[firstMinIndex]);
    for (int i=2; i < distances.length(); i++) {
      int j = i;
      swap(firstMinIndex, j, distances[j] < distances[firstMinIndex]);
      swap(secondMinIndex, j, distances[j] < distances[secondMinIndex]);
    }
    return distances[secondMinIndex] - distances[firstMinIndex];
  }`;}
}

export class SmoothClamp extends ScalarField {
  original: ScalarField;
  bottom: number;
  top: number;
  smoothness: number;
  constructor(original: ScalarField, bottom: number, top: number, smoothness: number) {
    super();
    this.original = original;
    this.bottom = bottom;
    this.top = top;
    this.smoothness = smoothness;
    this.dependentGlEntities.push(original);
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return smoothclamp(get_${this.original.id}(point), bottom_${this.id}, top_${this.id}, smoothness_${this.id});
  }`;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float bottom_${this.id};
    uniform float top_${this.id};
    uniform float smoothness_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `bottom_${this.id}`, this.bottom);
    GlEntity.setGlUniformFloat(gl, program, `top_${this.id}`, this.top);
    GlEntity.setGlUniformFloat(gl, program, `smoothness_${this.id}`, this.smoothness);
  }}
