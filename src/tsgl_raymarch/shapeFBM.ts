import * as util from './util';
import {GlEntity, HasShape, Shape3D} from './gl_entity';
import * as shapes from './shapes';
import * as rand from './random';


export class SpheresRand extends Shape3D {
  randGen: rand.GlRandom;
  constructor(randGen: rand.GlRandom) {
    super();
    this.randGen = randGen;
    this.dependentGlEntities.push(randGen);
  }
  getSphereDistance(point: util.Vec3, tetraIndex: util.TetrahedronCoord): number {
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
      vec3 origin = coord_TetrahedronToOrthogonal(tetraIndex);
      return length(point-origin) - r;
    }
  `;}
  override getDistance(point: util.Vec3): number {
    let tetraCoord = util.TetrahedronCoord.fromOrthogonal(point);
    let tetraIndices = tetraCoord.rounds();
    let distances = tetraIndices.map((i) => this.getSphereDistance(point, util.TetrahedronCoord.asTetrahedronCoord(i)));
    return Math.min(
      distances[0], distances[1], distances[2], distances[3],
      distances[4], distances[5], distances[6], distances[7],
    );
  }
  GlFunc_getDistance(): string {return `
    float getDistance_${this.id}(vec3 point) {
      vec3 tetraCoord = coord_OrthogonalToTetrahedron(point);
      vec3[8] tetraIndices = coord_rounds(tetraCoord);
      return min(
        min(
          min(
            getSphereDistance_${this.id}(point,tetraIndices[0]),
            getSphereDistance_${this.id}(point,tetraIndices[1])
          ), min(
            getSphereDistance_${this.id}(point,tetraIndices[2]),
            getSphereDistance_${this.id}(point,tetraIndices[3])
          )
        ), min(
          min(
            getSphereDistance_${this.id}(point,tetraIndices[4]),
            getSphereDistance_${this.id}(point,tetraIndices[5])
          ), min(
            getSphereDistance_${this.id}(point,tetraIndices[6]),
            getSphereDistance_${this.id}(point,tetraIndices[7])
          )
        )
      );
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


export class HullSpheres extends Shape3D {
  hull: shapes.Hollowed;
  spheres: shapes.Transform3D;
  smoothness: number;
  weight: number;
  constructor(original: GlEntity & HasShape, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number){
    super();
    this.hull = new shapes.Hollowed(original, scale);
    this.spheres = new shapes.Transform3D(
      new SpheresRand(randGen),
      scale, util.Quaternion.identity(), util.Vec3.zero()
    );
    this.smoothness = smoothness;
    this.weight = weight;
    this.dependentGlEntities.push(this.hull, this.spheres);
  }
  override getGlDeclarations(): string { return this.isGlDeclared()? `` : `
    ${super.getGlDeclarations()}
    uniform float smoothness_${this.id};
    uniform float weight_${this.id};
  `;}
  override setGlVars(gl: WebGL2RenderingContext, program: WebGLProgram) {
    super.setGlVars(gl, program);
    GlEntity.setGlUniformFloat(gl, program, `smoothness_${this.id}`, this.smoothness);
    GlEntity.setGlUniformFloat(gl, program, `weight_${this.id}`, this.weight);
  }
  override getDistance(point: util.Vec3): number { //blendIntersection
    return util.blend(
      this.hull.getDistance(point), this.spheres.getDistance(point), false, this.smoothness, this.weight
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

export class BlendBrownianMotion extends Shape3D {
  isUnion: boolean;
  original: GlEntity & HasShape;
  brownianMotion: HullSpheres;
  constructor(original: GlEntity & HasShape, isUnion: boolean, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super();
    this.isUnion = isUnion;
    this.original = original;
    this.brownianMotion = new HullSpheres(original, randGen, scale, smoothness, weight);
    this.dependentGlEntities.push(original, this.brownianMotion);
  }
  override getDistance(point: util.Vec3): number { //blendUnion
    return util.blend(
      this.original.getDistance(point), (this.isUnion?1:-1)*this.brownianMotion.getDistance(point),
      this.isUnion, this.brownianMotion.smoothness, this.brownianMotion.weight
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
  constructor(original: GlEntity & HasShape, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super(original, true, randGen, scale, smoothness, weight);
  }
}
export class SubtractBrownianMotion extends BlendBrownianMotion {
  constructor(original: GlEntity & HasShape, randGen: rand.GlRandom, scale: number, smoothness: number, weight: number) {
    super(original, false, randGen, scale, smoothness, weight);
  }
}
