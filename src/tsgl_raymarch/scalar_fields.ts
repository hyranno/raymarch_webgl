import * as util from './util';
import {GlRandom} from './random';
import {Transform, GlClosure1Args} from './gl_entity';
import {GlInt, GlFloat, GlVec3} from './gl_types';
import * as v3fields from '@tsgl/vec3_fields';

export abstract class ScalarField extends GlClosure1Args<GlVec3, GlFloat> {
  constructor(){
    super(GlVec3.default(), GlFloat.default());
  }
}

export class Constant extends ScalarField {
  value: GlFloat;
  constructor(value: number) {
    super();
    this.value = new GlFloat(value);
    this.glUniformVars.push({name: "value", value: this.value});
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return value_${this.id};
  }`;}
}

export abstract class Reduce extends ScalarField {
  lhs: GlClosure1Args<GlVec3, GlFloat>;
  rhs: GlClosure1Args<GlVec3, GlFloat>[];
  constructor(lhs: GlClosure1Args<GlVec3, GlFloat>, rhs: GlClosure1Args<GlVec3, GlFloat>[]) {
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
  original: GlClosure1Args<GlVec3, GlFloat>;
  transform: Transform;
  constructor(original: GlClosure1Args<GlVec3, GlFloat>, transform: Transform) {
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
  discrete: GlClosure1Args<GlVec3, GlFloat>;
  localField: GlClosure1Args<GlVec3, GlFloat>;
  constructor(discrete: GlClosure1Args<GlVec3, GlFloat>, localField: GlClosure1Args<GlVec3, GlFloat>) {
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
  discrete: GlClosure1Args<GlVec3, GlFloat>;
  localField: GlClosure1Args<GlVec3, GlFloat>;
  constructor(discrete: GlClosure1Args<GlVec3, GlFloat>, localField: GlClosure1Args<GlVec3, GlFloat>) {
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
  gain: GlFloat;
  depth: GlInt;
  offset: GlVec3;
  layer: GlClosure1Args<GlVec3, GlFloat>;
  constructor (gain: number, depth: number, offset: util.Vec3, layer: GlClosure1Args<GlVec3, GlFloat>) {
    super();
    this.gain = new GlFloat(gain);
    this.depth = new GlInt(depth);
    this.offset = new GlVec3(offset);
    this.layer = layer;
    this.dependentGlEntities.push(layer);
    this.glUniformVars.push(
      {name: "gain", value: this.gain},
      {name: "depth", value: this.depth},
      {name: "offset", value: this.offset},
    );
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
  original: GlClosure1Args<GlVec3, GlFloat>;
  bottom: GlFloat;
  top: GlFloat;
  smoothness: GlFloat;
  constructor(original: GlClosure1Args<GlVec3, GlFloat>, bottom: number, top: number, smoothness: number) {
    super();
    this.original = original;
    this.bottom = new GlFloat(bottom);
    this.top = new GlFloat(top);
    this.smoothness = new GlFloat(smoothness);
    this.dependentGlEntities.push(original);
    this.glUniformVars.push(
      {name: "bottom", value: this.bottom},
      {name: "top", value: this.top},
      {name: "smoothness", value: this.smoothness},
    );
  }
  override GlFunc_get(): string { return `float get_${this.id} (vec3 point) {
    return smoothclamp(${this.original.glFuncName}(point), bottom_${this.id}, top_${this.id}, smoothness_${this.id});
  }`;}
}
