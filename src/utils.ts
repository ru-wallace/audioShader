type programInfo_t = {
    program: WebGLProgram;
    attribLocations?: {
        [key: string]: GLint;
    };
    uniformLocations?: {
        [key: string]: WebGLUniformLocation|null;
    };
    vertexArrayObject?: WebGLVertexArrayObject;
};

type bufferInfo_t = {
    position: WebGLBuffer;
    element: WebGLBuffer;
    color?: WebGLBuffer;
};

function verifyProgramInfo(programInfo: programInfo_t): void {
    if (programInfo.attribLocations) {
        Object.keys(programInfo.attribLocations).forEach((key) => {
            if (programInfo.attribLocations) {
                console.log(`key: ${key}, value: ${programInfo.attribLocations[key]}`);
                if (programInfo.attribLocations[key] === -1 ) {
                    throw new Error(`Could not get attribute location for ${key}`);
                }
            }
        });
    }
    if (programInfo.uniformLocations) {
        Object.keys(programInfo.uniformLocations).forEach((key) => {
            if (programInfo.uniformLocations) {
                if (!programInfo.uniformLocations[key]) {
                    throw new Error(`Could not get uniform location for ${key}`);
                }
            }
        });
    }
    if (programInfo.vertexArrayObject !== undefined) {
        if (!programInfo.vertexArrayObject) {
            throw new Error('Could not create vertex array object');
        }
    }
    
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement|OffscreenCanvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.

    if (canvas instanceof HTMLCanvasElement) {
        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
       
        // Check if the canvas is not the same size.
        const needResize = canvas.width  !== displayWidth ||
                           canvas.height !== displayHeight;
       
        if (needResize) {
          // Make the canvas the same size
          canvas.width  = displayWidth;
          canvas.height = displayHeight;
        }
       
        return needResize;
    }
    return false;
    
}

//we need to duplicate vertex attributes to expand in the shader
//and mirror the normals
function duplicateMiters(nestedArray:number[]) {
    var out:number[] = []
    nestedArray.forEach(x => {
      let x1 =  -x;
      out.push(x1, x)
    })
    return out
}

function duplicateNormals(nestedArray:number[][]) {
    var out:number[][] = []
    nestedArray.forEach(x => {
      out.push(x, x)
    })
    return out
}
  
  //counter-clockwise indices but prepared for duplicate vertices
function createIndices(length:number) {
    let indices = new Uint16Array(length * 6)
    let c = 0, index = 0
    for (let j=0; j<length; j++) {
      let i = index
      indices[c++] = i + 0 
      indices[c++] = i + 1 
      indices[c++] = i + 2 
      indices[c++] = i + 2 
      indices[c++] = i + 1 
      indices[c++] = i + 3 
      index += 2
    }
    return indices
  }

export { resizeCanvasToDisplaySize, programInfo_t, verifyProgramInfo, bufferInfo_t, duplicateMiters, duplicateNormals, createIndices };