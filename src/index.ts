import { buildProgram } from './buildProgram.js';
import { resizeCanvasToDisplaySize, programInfo_t, verifyProgramInfo, bufferInfo_t, duplicateMiters, duplicateNormals, createIndices, uniformValues_t } from './utils.js';
import { initBuffers, updateElementBuffer, updatePositionBuffer } from './init-buffers.js';
import * as glMatrix from 'gl-matrix';
import { drawScene, setUniforms } from './draw-scene.js';
import { AudioProcessor } from './audio.js';
import getNormals from 'polyline-normals'

const canvas = <HTMLCanvasElement> document.getElementById('canvas');

//const timeDisplay = <HTMLSpanElement> document.getElementById('time');
const audioElement = <HTMLAudioElement> document.getElementById('audio');
const audioProcessor = new AudioProcessor(audioElement);

canvas.addEventListener('click', (e) => {
    if (e.target === canvas) {
        audioProcessor.toggle();
    } 
});

const thicknessSlider = <HTMLInputElement> document.getElementById('thickness-slider');

const timeDomainCheckbox = <HTMLInputElement> document.getElementById('time-domain-checkbox');
const orthoCheckbox = <HTMLInputElement> document.getElementById('ortho-checkbox');
const polarCheckbox = <HTMLInputElement> document.getElementById('polar-checkbox');
const mouseInteractionCheckbox = <HTMLInputElement> document.getElementById('mouse-interaction-checkbox');
const mouseMagSlider = <HTMLInputElement> document.getElementById('mouse-mag-slider');
const mouseAreaSlider = <HTMLInputElement> document.getElementById('mouse-area-slider');


function setMouseInteractionState(value:boolean) {
    let disabled = !value
    mouseInteractionCheckbox.checked = disabled ? mouseInteractionCheckbox.checked : false;
    mouseInteractionCheckbox.disabled = disabled;
    mouseMagSlider.disabled = disabled;
    mouseAreaSlider.disabled = disabled;
}


const viewXSlider = <HTMLInputElement> document.getElementById('viewX-slider');
const viewYSlider = <HTMLInputElement> document.getElementById('viewY-slider');
const viewZSlider = <HTMLInputElement> document.getElementById('viewZ-slider');

const rotateXSlider = <HTMLInputElement> document.getElementById('rotateX-slider');
const rotateYSlider = <HTMLInputElement> document.getElementById('rotateY-slider');
const rotateZSlider = <HTMLInputElement> document.getElementById('rotateZ-slider');


if (!canvas) {
  throw new Error('Canvas not found');
}

const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

if (!gl) {
  throw new Error('WebGL not supported');
}

const html5Canvas = <HTMLCanvasElement> document.getElementById('html5-canvas');
const html5Context = html5Canvas ? html5Canvas.getContext('2d' ) : null;

if (html5Context) {
    html5Context.clearRect(0, 0, html5Canvas.width, html5Canvas.height);
} 

// Get the shaders from the server
async function getShaders() : Promise<{ vertexShader: string, fragmentShader: string}> {
    const vertexShader = await fetch('./shader.vert').then((res) => res.text());
    const fragmentShader = await fetch('./shader.frag').then((res) => res.text());
    return { vertexShader, fragmentShader };
}

async function init() {
    const { vertexShader, fragmentShader } = await getShaders();
    const program = buildProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        throw new Error('Error creating program');
    }
    gl.useProgram(program);
    // Holds the program and the locations of the attributes and uniforms
    const programInfo: programInfo_t = {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, 'a_position'),
            normal: gl.getAttribLocation(program, 'a_normal'),
            miter: gl.getAttribLocation(program, 'a_miter')
        },
        uniforms: {
            mouseIn: {location: gl.getUniformLocation(program, 'u_mouseIn'), type: 'float', value: 0},
            mouseCoords: {location: gl.getUniformLocation(program, 'u_mouseCoords'), type: 'vec2', value: Float32Array.from([0, 0])},
            mouseMagnitude: {location: gl.getUniformLocation(program, 'u_mouseMagnitude'), type: 'float', value: 1},
            mouseArea: {location: gl.getUniformLocation(program, 'u_mouseArea'), type: 'float', value: 0.7},
            thickness: {location: gl.getUniformLocation(program, 'u_thickness'), type: 'float', value: null},
            polar: {location: gl.getUniformLocation(program, 'u_polar'), type: 'float', value: null},
            aspect: {location: gl.getUniformLocation(program, 'u_aspect'), type: 'float', value: null},
            projection: {location: gl.getUniformLocation(program, 'u_projectionMatrix'), type: 'mat4', value: null},
            view: {location: gl.getUniformLocation(program, 'u_viewMatrix'), type: 'mat4', value: null},
            model: {location: gl.getUniformLocation(program, 'u_modelMatrix'), type: 'mat4', value: null}
        },


    };

    console.log(programInfo.attribLocations);
    console.log(programInfo.uniforms);
    // Verify that the program and the locations of the attributes and uniforms are 
    //      valid. (Mostly just for typescript to know that they are not null and we have 
    //      the right uniform / attr names
    verifyProgramInfo(programInfo);

    // Initialise, bind and store the buffers
    const bufferInfo = initBuffers(gl);

    // Create a vertex array object to store the state of the vertex attributes
    const vao = gl.createVertexArray();
    if (!vao) {
        throw new Error('Could not create vertex array object');
    }




    programInfo.vertexArrayObject = vao;

    // Bind the vertex array object
    gl.bindVertexArray(programInfo.vertexArrayObject);

    // The canvas is resized to the display size (CSS pixels) so that the canvas
    //      is not stretched or distorted
    resizeCanvasToDisplaySize(gl.canvas);

    // Create the matrices for the projection, view and model
    let projectionMatrix = glMatrix.mat4.create();
    let rotationMatrix = glMatrix.mat4.create();
    let viewMatrix = glMatrix.mat4.create();
    let identityMatrix = glMatrix.mat4.create();

    // Set the initial values for the matrices to be transformed
    const rotateValues = {
        x: 0.0,
        //y: -0.5,
        y: 0.0,
        z: 0.0
    }

    const viewValues = {
        //x: 0.5, 
        x: 0.0,
        y: 0.0,
        z: -3.0
        
    }

    // Convert degrees to radians and vice versa (since the sliders are in degrees)

    function degToRad(d:number) {
        return d * Math.PI / 180;
    }
    function radToDeg(r:number) {
        return r * 180 / Math.PI;
    }

    rotateXSlider.value = radToDeg(rotateValues.x).toString();
    rotateYSlider.value = radToDeg(rotateValues.y).toString();
    rotateZSlider.value = radToDeg(rotateValues.z).toString();

    viewXSlider.value = viewValues.x.toString();
    viewYSlider.value = viewValues.y.toString();
    viewZSlider.value = viewValues.z.toString();

    // Create the matrices for the rotation and view
    // This is so that we can rotate the model and move the camera
    //     without applying the transformations to the original matrices
    //     again and again.

    let rotatedRotationMatrix = glMatrix.mat4.create();
    let translatedViewMatrix = glMatrix.mat4.create();


    glMatrix.mat4.scale(rotationMatrix, rotationMatrix, [1, 1, 1]);
    glMatrix.mat4.perspective(projectionMatrix, Math.PI/4, gl.canvas.width/gl.canvas.height, 0, 100);

    // Convert the matrices to 32 bit arrays so that they can be passed to the shader
    const projectionMatrix32 = new Float32Array(projectionMatrix);
    const viewMatrix32 = new Float32Array(translatedViewMatrix);
    const rotationMatrix32 = new Float32Array(rotationMatrix);

    // Get the initial values for the line thickness
    var lineThickness = parseFloat(thicknessSlider.value);

    // Store the uniforms in an object so that they can be passed to the shader

    programInfo.uniforms.projection.value = projectionMatrix32;
    programInfo.uniforms.view.value = viewMatrix32;
    programInfo.uniforms.model.value = rotationMatrix32;
    programInfo.uniforms.thickness.value = lineThickness;
    programInfo.uniforms.polar.value = polarCheckbox.checked ? 1 : 0;
    programInfo.uniforms.aspect.value = gl.canvas.width/gl.canvas.height;





    // Set the rotation matrix (If ortho is checked, disable rotation)
    function rotate() {
        if (orthoCheckbox.checked) {
            return;
        }

        rotateValues.x = degToRad(rotateXSlider.valueAsNumber);
        rotateValues.y = degToRad(rotateYSlider.valueAsNumber);
        rotateValues.z = degToRad(rotateZSlider.valueAsNumber);


        document.getElementById('rotateX')!.textContent = rotateXSlider.value;
        document.getElementById('rotateY')!.textContent = rotateYSlider.value;
        document.getElementById('rotateZ')!.textContent = rotateZSlider.value;

        glMatrix.mat4.rotateX(rotatedRotationMatrix, rotationMatrix, rotateValues.x);
        glMatrix.mat4.rotateY(rotatedRotationMatrix, rotatedRotationMatrix, rotateValues.y);
        glMatrix.mat4.rotateZ(rotatedRotationMatrix, rotatedRotationMatrix, rotateValues.z);
        programInfo.uniforms.model.value = new Float32Array(rotatedRotationMatrix);
    }

    rotateXSlider.addEventListener('input', rotate);
    rotateYSlider.addEventListener('input', rotate);
    rotateZSlider.addEventListener('input', rotate);

    // Set the view matrix (If ortho is checked, set to [0, 0, -0.5] since we're using orthographic projection)
    function view() {

        if (orthoCheckbox.checked) {
            viewValues.x = 0;
            viewValues.y = 0;
            viewValues.z = -0.5;
        } else {

        viewValues.x = viewXSlider.valueAsNumber;
        viewValues.y = viewYSlider.valueAsNumber;
        viewValues.z = viewZSlider.valueAsNumber;

        }

        document.getElementById('viewX')!.textContent = viewValues.x.toString();
        document.getElementById('viewY')!.textContent = viewValues.y.toString();
        document.getElementById('viewZ')!.textContent = viewValues.z.toString();

        glMatrix.mat4.translate(translatedViewMatrix, viewMatrix, [viewValues.x, viewValues.y, viewValues.z]);
        programInfo.uniforms.view.value = new Float32Array(translatedViewMatrix);
    }

    viewXSlider.addEventListener('input', view);
    viewYSlider.addEventListener('input', view);
    viewZSlider.addEventListener('input', view);

    // Set the perspective matrix (If ortho is checked, set to orthographic projection and disable rotation)
    function setPerspective() {
        const ortho = orthoCheckbox.checked;

        if (ortho) {
            //glMatrix.mat4.ortho(projectionMatrix, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, 0, 1);
            let identityMatrixArray = new Float32Array(identityMatrix);
            programInfo.uniforms.view.value = identityMatrixArray
            programInfo.uniforms.model.value = identityMatrixArray
            programInfo.uniforms.projection.value = identityMatrixArray;
            viewXSlider.disabled = true;
            viewYSlider.disabled = true;
            viewZSlider.disabled = true;
            rotateXSlider.disabled = true;
            rotateYSlider.disabled = true;
            rotateZSlider.disabled = true;
        } else {
            glMatrix.mat4.perspective(projectionMatrix, Math.PI/4, gl.canvas.width/gl.canvas.height, 0, 100);
            programInfo.uniforms.view.value = new Float32Array(translatedViewMatrix);
            programInfo.uniforms.model.value = new Float32Array(rotatedRotationMatrix);
            programInfo.uniforms.projection.value = new Float32Array(projectionMatrix);
            viewXSlider.disabled = false;
            viewYSlider.disabled = false;
            viewZSlider.disabled = false;
            rotateXSlider.disabled = false;
            rotateYSlider.disabled = false;
            rotateZSlider.disabled = false;
        }
        
    }


    orthoCheckbox.addEventListener('change', (e) => {
        setPerspective();
        rotate();
        view();
    });

    function handleInteraction(e:MouseEvent|TouchEvent) {
        if (!mouseInteractionCheckbox.checked) {
            return;
        }

        let eventX, eventY;
        if (e instanceof MouseEvent) {
            eventX = e.clientX;
            eventY = e.clientY;
        } else if (e instanceof TouchEvent) {
            eventX = e.touches[0].clientX;
            eventY = e.touches[0].clientY;
        }

        if (!eventX || !eventY) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = 2*(eventX - rect.left)/canvas.width-1;
        const y = (2*(eventY - rect.top)/canvas.height-1)*-1;
        const coords = Float32Array.from([x, y]);
        programInfo.uniforms.mouseCoords.value = coords;
        programInfo.uniforms.mouseIn.value = 1;
    }

    canvas.addEventListener('mousemove', (e) => {
        handleInteraction(e);
    });

    canvas.addEventListener('touchmove', (e) => {
        handleInteraction(e);
    });

    canvas.addEventListener('mouseleave', (e) => {
        programInfo.uniforms.mouseIn.value = 0;
    });
    canvas.addEventListener('touchend', (e) => {

        programInfo.uniforms.mouseIn.value = 0;
    });

    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (e.shiftKey) {
            programInfo.uniforms.mouseArea.value += e.deltaY/-1000;
            if (programInfo.uniforms.mouseArea.value < 0.1) {
                programInfo.uniforms.mouseArea.value = 0.1;
            }
            if (programInfo.uniforms.mouseArea.value > 2) {
                programInfo.uniforms.mouseArea.value = 2;
            }
            mouseAreaSlider.value = programInfo.uniforms.mouseArea.value.toString();
            document.getElementById('mouse-area-value')!.textContent = programInfo.uniforms.mouseArea.value.toFixed(2).toString();
            return;
        }



        programInfo.uniforms.mouseMagnitude.value += e.deltaY/-3000;
        if (programInfo.uniforms.mouseMagnitude.value < -5) {
            programInfo.uniforms.mouseMagnitude.value = -5;
        }
        if (programInfo.uniforms.mouseMagnitude.value > 10) {
            programInfo.uniforms.mouseMagnitude.value = 10;
        }
        mouseMagSlider.value = programInfo.uniforms.mouseMagnitude.value.toString();
        document.getElementById('mouse-mag-value')!.textContent = programInfo.uniforms.mouseMagnitude.value.toFixed(1).toString();
    });

    mouseMagSlider.addEventListener('input', (e) => {
        programInfo.uniforms.mouseMagnitude.value = mouseMagSlider.valueAsNumber;
        document.getElementById('mouse-mag-value')!.textContent = programInfo.uniforms.mouseMagnitude.value.toFixed(1).toString();

    });

    mouseAreaSlider.addEventListener('input', (e) => {
        programInfo.uniforms.mouseArea.value = mouseAreaSlider.valueAsNumber;
        document.getElementById('mouse-area-value')!.textContent = programInfo.uniforms.mouseArea.value.toFixed(2).toString();
    });

    mouseMagSlider.dispatchEvent(new Event('input'));
    mouseAreaSlider.dispatchEvent(new Event('input'));

    mouseInteractionCheckbox.addEventListener('change', (e) => {
        mouseAreaSlider.disabled = !mouseInteractionCheckbox.checked;
        mouseMagSlider.disabled = !mouseInteractionCheckbox.checked;
    });
    

    setPerspective();
    view();
    rotate();

   
    // Add event listener for slider controlling line thickness
    thicknessSlider.addEventListener('input', (e) => {

        programInfo.uniforms.thickness.value = thicknessSlider.valueAsNumber;
        document.getElementById('thickness')!.textContent = programInfo.uniforms.thickness.value.toString();
    });

    thicknessSlider.dispatchEvent(new Event('input'));


    // Add event listener for polar checkbox
    polarCheckbox.addEventListener('change', (e) => {
        
        programInfo.uniforms.polar.value = polarCheckbox.checked ? 1 : 0;
        setMouseInteractionState(polarCheckbox.checked)
    });

    programInfo.uniforms.polar.value = polarCheckbox.checked ? 1 : 0;
    setMouseInteractionState(polarCheckbox.checked);



    const startTime = Date.now();
    const bufferLength = audioProcessor.getBufferLength();
    const frequencyData = new Uint8Array(bufferLength);


    function render(now:number) {
        const aspect = gl.canvas.width / gl.canvas.height;
        // Update the time display
        //const currentTime = Date.now();
        //timeDisplay.textContent = ((currentTime - startTime)/1000).toFixed(2).toString();
        //now *= 0.001;

        // Get the frequency data from the audio processor and store it in the frequencyData array
        let normCoeff = 1.0/255.0;

        if (timeDomainCheckbox.checked) {
            audioProcessor.getTimeDomainData(frequencyData);
            normCoeff = 1.0/128.0;
        } else {
            audioProcessor.getFrequencyData(frequencyData);
        }

        // Turn the frequency data into an array of points
         const path: [number, number][] = Array.from(frequencyData).map((y, x) =>  {
            if (timeDomainCheckbox.checked) {
                return [2*x/frequencyData.length - 1, 2*(y*normCoeff-1) ];
         } else {
            return [2*x/frequencyData.length - 1, 1.8*y*normCoeff - 0.9];
         }
    });




        if (html5Context) { // If we're using the 2d canvas for testing, draw the path there
            html5Context.clearRect(0, 0, html5Canvas.width, html5Canvas.height);
            html5Context.fillRect(0, 0, html5Canvas.width, html5Canvas.height);
            html5Context.lineWidth = 2;
            html5Context.strokeStyle = 'red'
            html5Context.beginPath();
            const sliceWidth = html5Canvas.width * 1.0 / frequencyData.length;
            let x = 0;
            for (let i = 0; i < frequencyData.length; i++) {
                const v = frequencyData[i] / 255;
                const y = html5Canvas.height - v * html5Canvas.height;
                if (i === 0) {
                    html5Context.moveTo(x, y);
                } else {
                    html5Context.lineTo(x, y);
                }
                x += sliceWidth;
            }
            html5Context.stroke();
        }

        // Get the normals and miters for the path (Used to increase line /
        // thickness in shader by drawing as triangles rather than lines)
        const normalMitres = getNormals(path, true);

        var normals = normalMitres.map((x) => x[0]);
        var miters = normalMitres.map((x) => x[1]);
        //duplicate the normals and miters to expand in the shader as triangles.
        normals = duplicateNormals(normals);
        miters = duplicateMiters(miters);

        const positions = duplicateNormals(path);

        const indices = createIndices(frequencyData.length);

        const positionsFlat = positions.flat();
        const normalsFlat = normals.flat();

        
        const joined = positionsFlat.concat(normalsFlat).concat(miters);
        const vertexData = Float32Array.from(joined);

        // Update the buffers with the new data
        //Element buffer is updated with the indices and tells shader which vertices to draw
        updateElementBuffer(gl, bufferInfo.element, indices);

        //Position buffer is updated with the vertex data
        updatePositionBuffer(gl, bufferInfo.position, vertexData);

        drawScene(gl, programInfo, bufferInfo, frequencyData.length);
        requestAnimationFrame(render);
        
    }
        
    requestAnimationFrame(render);

}




init();