import {bufferInfo_t, programInfo_t, verifyProgramInfo} from './utils';

function drawScene(gl:WebGL2RenderingContext, programInfo:programInfo_t, buffers: bufferInfo_t, nVertices:number, uniforms:{thickness:number, projection:Float32Array, view:Float32Array, model:Float32Array}) {

    

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
   
    gl.clear(gl.COLOR_BUFFER_BIT);

    //set thickness uniform
    if (!programInfo.uniformLocations || programInfo.uniformLocations?.thickness === null) {
        throw new Error('Could not get uniform location for thickness');
    }

    
   
  
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setAttributes(gl, buffers, programInfo, nVertices);
  
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.enable(gl.BLEND)
    
    setUniforms(gl, programInfo, uniforms.thickness, uniforms.projection, uniforms.view, uniforms.model);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    {
      const offset = 0;
      const vertexCount = nVertices;

      const elementType = gl.UNSIGNED_SHORT;
      gl.drawElements(gl.TRIANGLES, (vertexCount-1)*6, elementType, offset);
    }
  }
  
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  function setAttributes(gl:WebGL2RenderingContext, buffers:bufferInfo_t, programInfo:programInfo_t, nVertices:number) {
    
    if (!programInfo.attribLocations || programInfo.attribLocations?.vertexPosition === -1 || programInfo.attribLocations?.normal === -1 || programInfo.attribLocations?.miter === -1) {
        throw new Error('Could not get attribute locations');
    }
    
    const numComponents = 2; // pull out 2 values per iteration
    const miterNumComponents = 1;
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    const normalStride = 0;
    const miterStride = 0;
    const offset = 0; // how many bytes inside the buffer to start from
    const normalOffset = 8*nVertices;
    const miterOffset = normalOffset*2;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.vertexAttribPointer(
        programInfo.attribLocations.normal,
        numComponents,
        type,
        normalize,
        normalStride,
        normalOffset,
      );

      gl.enableVertexAttribArray(programInfo.attribLocations.normal);

      gl.vertexAttribPointer(
        programInfo.attribLocations.miter,
        miterNumComponents,
        type,
        normalize,
        miterStride,
        miterOffset
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.miter);
  }

  function setUniforms(gl:WebGL2RenderingContext, programInfo:programInfo_t, thickness:number, projectionMatrix:Float32Array, viewMatrix:Float32Array, modelMatrix:Float32Array) {
    if (!programInfo.uniformLocations || programInfo.uniformLocations?.projection === null || programInfo.uniformLocations?.view === null || programInfo.uniformLocations?.model === null) {
        throw new Error('Could not get uniform locations');
    }

    gl.uniform1f(programInfo.uniformLocations.thickness,thickness);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projection,
        false,
        projectionMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.view,
        false,
        viewMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.model,
        false,
        modelMatrix
    );
  }


  export { drawScene, setUniforms };
  