import {asTemplate} from './util';
import {Drawable, Light, Camera} from './gl_entity';

import {fragShaderTemplate} from './gl_source';

export class GlRenderer {
  cameras: Camera[];
  drawables: Drawable[];
  lights: Light[];
  context: WebGL2RenderingContext;
  program: WebGLProgram;
  glBuffer: WebGLBuffer;
  constructor(gl: WebGL2RenderingContext, cameras: Camera[], drawables: Drawable[], lights: Light[]) {
    this.cameras = cameras;
    this.drawables = drawables;
    this.lights = lights;
    this.context = gl;
    this.program = this.context.createProgram();
    this.glBuffer = this.context.createBuffer();
    this.prepareShader(gl.VERTEX_SHADER, this.getVertexShaderSource());
    console.log(this.getFragmentShaderSource());
    this.prepareShader(gl.FRAGMENT_SHADER, this.getFragmentShaderSource());
    this.context.linkProgram(this.program);
    if (!this.context.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.log(this.context.getProgramInfoLog(this.program)); //error
    }
  }
  draw(camIndex: number): void {
    this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);

    this.context.useProgram(this.program);
    this.cameras.forEach((c)=>c.setGlVars(this.context, this.program));
    this.drawables.forEach((d)=>d.setGlVars(this.context, this.program));
    this.lights.forEach((l)=>l.setGlVars(this.context, this.program));
    this.context.uniform1ui(this.context.getUniformLocation(this.program, `camera_id`), this.cameras[camIndex].id);

    var vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.glBuffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), this.context.STATIC_DRAW);
    var location = this.context.getAttribLocation(this.program, 'position');
    this.context.enableVertexAttribArray(location);
    this.context.vertexAttribPointer(location, vertexPositions[0].length, this.context.FLOAT, false, 0, 0);

    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.flush();
  }

  getVertexShaderSource(): string {return `#version 300 es
    in vec2 position;
    void main(void) {
      gl_Position = vec4(position, 0, 1);
    }
  `;}
  getFragmentShaderSource(): string {
    this.drawables.forEach((entity) => entity.clearGlSourceStates());
    this.lights.forEach((entity) => entity.clearGlSourceStates());
    this.cameras.forEach((entity) => entity.clearGlSourceStates());
    return asTemplate(fragShaderTemplate, {
      drawables: this.drawables,
      lights: this.lights,
      cameras: this.cameras,
    });
  }
  private prepareShader(type: number, source: string) {
    var shader = this.context.createShader(type);
    this.context.shaderSource(shader, source);
    this.context.compileShader(shader);
    if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)){
      console.log(this.context.getShaderInfoLog(shader)); //error
    }
    this.context.attachShader(this.program, shader);
  }

}
