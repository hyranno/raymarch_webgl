import * as util from './util';
import {GlEntity} from './gl_entity';
import {GlFloat, GlVec3, Transform} from './gl_types';
import {TsGlClosure} from './tsgl_closure';
import * as shapes from './shapes';
import * as rand from './random';


export class SpheresRand extends shapes.Shape3D {
  randGen: rand.GlRandom;
  constructor(randGen: rand.GlRandom) {
    super();
    this.randGen = randGen;
    this.dependentGlEntities.push(randGen);
  }
  getSphereDistance(point: util.Vec3, tetraIndex: util.Simplex3Coord): number {
    let seed = rand.hash32([tetraIndex[0], tetraIndex[1], tetraIndex[2]]);
    let state = rand.PCG16.init(seed);
    let r = 0.5 * util.smoothclamp(this.randGen.rand(state).value, 0.01, 1, 0.1); // select rand
    let origin = tetraIndex.toOrthogonal();
    return point.add(origin.negative()).len() - r;
  }
  GlFunc_getSphereDistance(): string {return `
    float getSphereDistance_${this.id}(vec3 point, vec3 tetraIndex) {
      uvec3 uIndex = uvec3(tetraIndex);
      uint rand_state;
      PCG16_init(hash32( uint[](uIndex.x, uIndex.y, uIndex.z) ), rand_state);
      float r = 0.5 * smoothclamp( rand_${this.randGen.id}(rand_state), 0.01, 1.0, 0.1 );
      vec3 origin = coord_Simplex3ToOrthogonal(tetraIndex);
      return length(point-origin) - r;
    }
  `;}
  override getDistance(point: util.Vec3): number {
    let tetraCoord = util.Simplex3Coord.fromOrthogonal(point);
    let tetraIndices = tetraCoord.neighbors();
    let distances = tetraIndices.map((i) => this.getSphereDistance(point, util.Simplex3Coord.asSimplex3Coord(i)));
    return distances.reduce((prev,current) => Math.min(prev, current));
  }
  GlFunc_getDistance(): string {return `
    float getDistance_${this.id}(vec3 point) {
      vec3 tetraCoord = coord_OrthogonalToSimplex3(point);
      vec3[13] tetraIndices = simplex3_neighbors(tetraCoord);
      float res = getSphereDistance_${this.id}(point,tetraIndices[0]);
      for (int i=1; i<tetraIndices.length(); i++) {
        res = min(res, getSphereDistance_${this.id}(point,tetraIndices[i]));
      }
      return res;
    }
  `;}
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    float getSphereDistance_${this.id}(vec3 point, vec3 tetraIndex);
  `;}
  override getGlImplements(): string { return this.isGlImplemented()? `` : `
    ${super.getGlImplements()}
    ${this.GlFunc_getSphereDistance()}
  `;}
}


export class HullSpheres extends shapes.Shape3D {
  hull: shapes.Hollowed;
  spheres: shapes.Transformed;
  smoothness: GlFloat;
  weight: GlFloat;
  constructor(original: TsGlClosure<GlFloat, [GlVec3]>, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number){
    super();
    this.hull = new shapes.Hollowed(original, scale);
    this.spheres = new shapes.Transformed(
      new SpheresRand(randGen),
      new Transform(scale, util.Quaternion.identity(), util.Vec3.zero())
    );
    this.smoothness = new GlFloat(smoothness);
    this.weight = new GlFloat(weight);
    this.dependentGlEntities.push(this.hull, this.spheres);
    this.glUniformVars.push(
      {name: "smoothness", value: this.smoothness},
      {name: "weight", value: this.weight},
    );
  }

  override getDistance(point: util.Vec3): number { //blendIntersection
    return util.blend(
      this.hull.getDistance(point), this.spheres.getDistance(point), false, this.smoothness.value, this.weight.value
    );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return blend(
        getDistance_${this.hull.id}(point), getDistance_${this.spheres.id}(point), false,
        smoothness_${this.id}, weight_${this.id}
      );
    }`;
  }
}

export class BlendBrownianMotion extends shapes.Shape3D {
  isUnion: boolean;
  original: shapes.Shape3D;
  brownianMotion: HullSpheres;
  constructor(original: shapes.Shape3D, isUnion: boolean, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super();
    this.isUnion = isUnion;
    this.original = original;
    this.brownianMotion = new HullSpheres(original, randGen, scale, smoothness, weight);
    this.dependentGlEntities.push(original, this.brownianMotion);
  }
  override getDistance(point: util.Vec3): number { //blendUnion
    return util.blend(
      this.original.getDistance(point), (this.isUnion?1:-1)*this.brownianMotion.getDistance(point),
      this.isUnion, this.brownianMotion.smoothness.value, this.brownianMotion.weight.value
    );
  }
  override GlFunc_getDistance(): string {
    return `float getDistance_${this.id} (vec3 point) {
      return blend(
        getDistance_${this.original.id}(point), float(${(this.isUnion?1:-1)})*getDistance_${this.brownianMotion.id}(point),
        ${this.isUnion}, smoothness_${this.brownianMotion.id}, weight_${this.brownianMotion.id}
      );
    }`;
  }
}

export class UnionBrownianMotion extends BlendBrownianMotion {
  constructor(original: shapes.Shape3D, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super(original, true, randGen, scale, smoothness, weight);
  }
}
export class SubtractBrownianMotion extends BlendBrownianMotion {
  constructor(original: shapes.Shape3D, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super(original, false, randGen, scale, smoothness, weight);
  }
}
