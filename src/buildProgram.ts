function createShader(gl:WebGL2RenderingContext, type:GLenum, source:string): WebGLShader|null {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Error creating shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}


function createProgram(gl:WebGL2RenderingContext, vertexShader:WebGLShader, fragmentShader:WebGLShader): WebGLProgram|null {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('Error creating program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

function buildProgram(gl:WebGL2RenderingContext, vertexShaderSource:string, fragmentShaderSource:string): WebGLProgram|null {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) {
        return null;
    }
    return createProgram(gl, vertexShader, fragmentShader);
}


export { buildProgram };