/**
 * Mock implementation of WebGL rendering context for testing
 */
export class WebGLRenderingContextMock {
  constructor() {
    this.canvas = { width: 800, height: 600 };
    this.drawingBufferWidth = 800;
    this.drawingBufferHeight = 600;

    // Track calls for assertions
    this.calls = [];

    // Mock WebGL constants
    this.COLOR_BUFFER_BIT = 0x00004000;
    this.DEPTH_BUFFER_BIT = 0x00000100;
    this.STENCIL_BUFFER_BIT = 0x00000400;

    this.ARRAY_BUFFER = 0x8892;
    this.ELEMENT_ARRAY_BUFFER = 0x8893;

    this.FLOAT = 0x1406;
    this.UNSIGNED_BYTE = 0x1401;
    this.UNSIGNED_SHORT = 0x1403;

    this.TRIANGLES = 0x0004;
    this.TRIANGLE_STRIP = 0x0005;

    this.FRAGMENT_SHADER = 0x8b30;
    this.VERTEX_SHADER = 0x8b31;

    this.COMPILE_STATUS = 0x8b81;
    this.LINK_STATUS = 0x8b82;

    this.TEXTURE_2D = 0x0de1;
    this.TEXTURE0 = 0x84c0;
  }

  // WebGL API methods
  viewport(x, y, width, height) {
    this.calls.push({ method: "viewport", args: [x, y, width, height] });
  }

  clearColor(r, g, b, a) {
    this.calls.push({ method: "clearColor", args: [r, g, b, a] });
  }

  clear(mask) {
    this.calls.push({ method: "clear", args: [mask] });
  }

  createBuffer() {
    const buffer = { id: Math.random().toString(36).substring(2, 9) };
    this.calls.push({ method: "createBuffer", result: buffer });
    return buffer;
  }

  bindBuffer(target, buffer) {
    this.calls.push({ method: "bindBuffer", args: [target, buffer] });
  }

  bufferData(target, data, usage) {
    this.calls.push({ method: "bufferData", args: [target, data, usage] });
  }

  createShader(type) {
    const shader = { id: Math.random().toString(36).substring(2, 9), type };
    this.calls.push({ method: "createShader", args: [type], result: shader });
    return shader;
  }

  shaderSource(shader, source) {
    shader.source = source;
    this.calls.push({ method: "shaderSource", args: [shader, source] });
  }

  compileShader(shader) {
    shader.compiled = true;
    this.calls.push({ method: "compileShader", args: [shader] });
  }

  getShaderParameter(shader, param) {
    this.calls.push({ method: "getShaderParameter", args: [shader, param] });
    return true; // Always succeeds in mock
  }

  getShaderInfoLog(shader) {
    this.calls.push({ method: "getShaderInfoLog", args: [shader] });
    return ""; // No errors in mock
  }

  createProgram() {
    const program = {
      id: Math.random().toString(36).substring(2, 9),
      uniforms: {},
    };
    this.calls.push({ method: "createProgram", result: program });
    return program;
  }

  attachShader(program, shader) {
    if (!program.shaders) program.shaders = [];
    program.shaders.push(shader);
    this.calls.push({ method: "attachShader", args: [program, shader] });
  }

  linkProgram(program) {
    program.linked = true;
    this.calls.push({ method: "linkProgram", args: [program] });
  }

  getProgramParameter(program, param) {
    this.calls.push({ method: "getProgramParameter", args: [program, param] });
    return true; // Always succeeds in mock
  }

  useProgram(program) {
    this.currentProgram = program;
    this.calls.push({ method: "useProgram", args: [program] });
  }

  getAttribLocation(program, name) {
    const location = program.attribs?.[name] || program.attribs?.length || 0;
    if (!program.attribs) program.attribs = {};
    program.attribs[name] = location;
    this.calls.push({
      method: "getAttribLocation",
      args: [program, name],
      result: location,
    });
    return location;
  }

  getUniformLocation(program, name) {
    const location = { program: program.id, name };
    if (!program.uniforms) program.uniforms = {};
    program.uniforms[name] = location;
    this.calls.push({
      method: "getUniformLocation",
      args: [program, name],
      result: location,
    });
    return location;
  }

  enableVertexAttribArray(index) {
    this.calls.push({ method: "enableVertexAttribArray", args: [index] });
  }

  vertexAttribPointer(index, size, type, normalized, stride, offset) {
    this.calls.push({
      method: "vertexAttribPointer",
      args: [index, size, type, normalized, stride, offset],
    });
  }

  drawArrays(mode, first, count) {
    this.calls.push({ method: "drawArrays", args: [mode, first, count] });
  }

  drawElements(mode, count, type, offset) {
    this.calls.push({
      method: "drawElements",
      args: [mode, count, type, offset],
    });
  }

  createTexture() {
    const texture = { id: Math.random().toString(36).substring(2, 9) };
    this.calls.push({ method: "createTexture", result: texture });
    return texture;
  }

  activeTexture(texture) {
    this.calls.push({ method: "activeTexture", args: [texture] });
  }

  bindTexture(target, texture) {
    this.calls.push({ method: "bindTexture", args: [target, texture] });
  }

  texImage2D(
    target,
    level,
    internalformat,
    width,
    height,
    border,
    format,
    type,
    pixels
  ) {
    // Handle the overloaded method signature
    if (arguments.length === 9) {
      this.calls.push({
        method: "texImage2D",
        args: [
          target,
          level,
          internalformat,
          width,
          height,
          border,
          format,
          type,
          pixels ? "pixels" : null,
        ],
      });
    } else {
      // Alternate form with HTMLImageElement
      this.calls.push({
        method: "texImage2D",
        args: [
          target,
          level,
          internalformat,
          format,
          type,
          pixels ? "image" : null,
        ],
      });
    }
  }

  texParameteri(target, pname, param) {
    this.calls.push({ method: "texParameteri", args: [target, pname, param] });
  }

  uniform1i(location, value) {
    this.calls.push({ method: "uniform1i", args: [location, value] });
  }

  uniform1f(location, value) {
    this.calls.push({ method: "uniform1f", args: [location, value] });
  }

  uniform2f(location, x, y) {
    this.calls.push({ method: "uniform2f", args: [location, x, y] });
  }

  uniform3f(location, x, y, z) {
    this.calls.push({ method: "uniform3f", args: [location, x, y, z] });
  }

  uniform4f(location, x, y, z, w) {
    this.calls.push({ method: "uniform4f", args: [location, x, y, z, w] });
  }

  uniformMatrix4fv(location, transpose, value) {
    this.calls.push({
      method: "uniformMatrix4fv",
      args: [location, transpose, "Float32Array"],
    });
  }

  // Helper methods for testing
  getCallCount(methodName) {
    return this.calls.filter((call) => call.method === methodName).length;
  }

  getLastCall(methodName) {
    const calls = this.calls.filter((call) => call.method === methodName);
    return calls[calls.length - 1];
  }

  clearCalls() {
    this.calls = [];
  }
}

// Helper to mock the canvas getContext method
export function mockWebGLCanvas() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (contextType) {
    if (
      contextType === "webgl" ||
      contextType === "webgl2" ||
      contextType === "experimental-webgl"
    ) {
      return new WebGLRenderingContextMock();
    }

    // Call original for other context types
    return originalGetContext.apply(this, arguments);
  };

  return function restoreWebGLCanvas() {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  };
}
