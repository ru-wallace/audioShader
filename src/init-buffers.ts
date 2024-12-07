
import { bufferInfo_t } from './utils';

function initBuffers(gl: WebGL2RenderingContext) {
    

    const positionBuffer = initPositionBuffer(gl);
    if (!positionBuffer) {
        throw new Error('Could not create position buffer');
    }

    const elementBuffer = initElementBuffer(gl);

    if (!elementBuffer) {
        throw new Error('Could not create element buffer');
    }

    var bufferInfo: bufferInfo_t = {
        position: positionBuffer,
        element: elementBuffer
    };
    
    return bufferInfo;
  }
  
function initPositionBuffer(gl: WebGL2RenderingContext) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    return positionBuffer;
}

function initElementBuffer(gl: WebGL2RenderingContext) {
    const elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);

    return elementBuffer;
}

  function initColorBuffer(gl: WebGL2RenderingContext, colors: Float32Array) {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  
  
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  
    return colorBuffer
}



function updatePositionBuffer(gl: WebGL2RenderingContext, buffer: WebGLBuffer, positions: Float32Array) {
    //gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
}

function updateElementBuffer(gl: WebGL2RenderingContext, buffer: WebGLBuffer, elements: Uint16Array) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.DYNAMIC_DRAW);
}


  
  export { initBuffers, updatePositionBuffer, updateElementBuffer};
  