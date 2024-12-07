import { buildProgram } from './buildProgram.js';
import { resizeCanvasToDisplaySize, programInfo_t, verifyProgramInfo, bufferInfo_t, duplicateMiters, duplicateNormals, createIndices } from './utils.js';
import { initBuffers, updateElementBuffer, updatePositionBuffer } from './init-buffers.js';
import * as glMatrix from 'gl-matrix';
import { drawScene, setUniforms } from './draw-scene.js';
import { AudioProcessor } from './audio.js';
import getNormals from 'polyline-normals'

const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const timeDisplay = <HTMLSpanElement> document.getElementById('time');
const audioElement = <HTMLAudioElement> document.getElementById('audio');
const audioProcessor = new AudioProcessor(audioElement);
const thicknessSlider = <HTMLInputElement> document.getElementById('thickness-slider');

const orthoCheckbox = <HTMLInputElement> document.getElementById('ortho-checkbox');

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

    const programInfo: programInfo_t = {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, 'a_position'),
            normal: gl.getAttribLocation(program, 'a_normal'),
            miter: gl.getAttribLocation(program, 'a_miter')
        },
        uniformLocations: {
            thickness: gl.getUniformLocation(program, 'u_thickness'),
            projection: gl.getUniformLocation(program, 'u_projectionMatrix'),
            view: gl.getUniformLocation(program, 'u_viewMatrix'),
            model: gl.getUniformLocation(program, 'u_modelMatrix')
        },


    };



    verifyProgramInfo(programInfo);




    const bufferInfo = initBuffers(gl);

    const vao = gl.createVertexArray();
    if (!vao) {
        throw new Error('Could not create vertex array object');
    }




    programInfo.vertexArrayObject = vao;
    gl.bindVertexArray(programInfo.vertexArrayObject);
    resizeCanvasToDisplaySize(gl.canvas);

    let projectionMatrix = glMatrix.mat4.create();
    let rotationMatrix = glMatrix.mat4.create();
    let viewMatrix = glMatrix.mat4.create();
    let identityMatrix = glMatrix.mat4.create();

    const rotateValues = {
        x: 0.0,
        y: -0.5,
        z: 0.0
    }

    const viewValues = {
        x: 0.5, 
        y: 0.0,
        z: -3.0
    }

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

    
    



    let rotatedRotationMatrix = glMatrix.mat4.create();
    let translatedViewMatrix = glMatrix.mat4.create();


    glMatrix.mat4.scale(rotationMatrix, rotationMatrix, [1, 1, 1]);
    glMatrix.mat4.perspective(projectionMatrix, Math.PI/4, gl.canvas.width/gl.canvas.height, 0, 100);

    const projectionMatrix32 = new Float32Array(projectionMatrix);
    const viewMatrix32 = new Float32Array(translatedViewMatrix);
    const rotationMatrix32 = new Float32Array(rotationMatrix);



    const startTime = Date.now();
    var lineThickness = parseFloat(thicknessSlider.value);


    const uniforms = {
        projection: projectionMatrix32,
        view: viewMatrix32,
        model: rotationMatrix32,
        thickness: lineThickness
    };


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
        uniforms.model = new Float32Array(rotatedRotationMatrix);
    }

    rotateXSlider.addEventListener('input', rotate);
    rotateYSlider.addEventListener('input', rotate);
    rotateZSlider.addEventListener('input', rotate);

    function view() {
        if (orthoCheckbox.checked) {
            return;
        }
        viewValues.x = viewXSlider.valueAsNumber;
        viewValues.y = viewYSlider.valueAsNumber;
        viewValues.z = viewZSlider.valueAsNumber;

        document.getElementById('viewX')!.textContent = viewValues.x.toString();
        document.getElementById('viewY')!.textContent = viewValues.y.toString();
        document.getElementById('viewZ')!.textContent = viewValues.z.toString();

        glMatrix.mat4.translate(translatedViewMatrix, viewMatrix, [viewValues.x, viewValues.y, viewValues.z]);
        uniforms.view = new Float32Array(translatedViewMatrix);
    }

    viewXSlider.addEventListener('input', view);
    viewYSlider.addEventListener('input', view);
    viewZSlider.addEventListener('input', view);

    function setPerspective() {
        const ortho = orthoCheckbox.checked;

        if (ortho) {
            glMatrix.mat4.ortho(projectionMatrix, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, 0, 1);
            uniforms.view = new Float32Array(identityMatrix);
            uniforms.model = new Float32Array(identityMatrix);
        } else {
            glMatrix.mat4.perspective(projectionMatrix, Math.PI/4, gl.canvas.width/gl.canvas.height, 0, 100);
            uniforms.view = new Float32Array(translatedViewMatrix);
            uniforms.model = new Float32Array(rotatedRotationMatrix);
        }
        uniforms.projection = new Float32Array(projectionMatrix);
    }


    orthoCheckbox.addEventListener('change', (e) => {
        setPerspective();
        rotate();
        view();
    });

    setPerspective();
    view();
    rotate();

    
    thicknessSlider.addEventListener('input', (e) => {
        if (!programInfo.uniformLocations || programInfo.uniformLocations?.thickness === null) {
            throw new Error('Could not get uniform location for thickness');
        }
        uniforms.thickness = parseFloat(thicknessSlider.value);
        document.getElementById('thickness')!.textContent = uniforms.thickness.toString();
    });





    let then=0;

    let count = 0;

    const bufferLength = audioProcessor.getBufferLength();
    const frequencyData = new Uint8Array(bufferLength);


    function render(now:number) {

        const currentTime = Date.now();
        timeDisplay.textContent = ((currentTime - startTime)/1000).toFixed(2).toString();
        now *= 0.001;

        const deltaTime = now - then;
        then = now;
        audioProcessor.getFrequencyData(frequencyData);
        const xData = Array.from(Array(frequencyData.length).keys(), x => ((2*x)/frequencyData.length) -1 );
        // create new array of positions where y is based on frequency data and x is based on index
        const path: number[][] = xData.map((x, i) => [x, (2*frequencyData[i]/255) - 1]);

        const normalMitres = getNormals(path, true);

        var normals = normalMitres.map((x) => x[0]);
        var miters = normalMitres.map((x) => x[1]);
        count = (path.length) * 6;

        normals = duplicateNormals(normals);
        miters = duplicateMiters(miters);

        const positions = duplicateNormals(path);

        const indices = createIndices(frequencyData.length);

        const positionsFlat = positions.flat();
        const normalsFlat = normals.flat(2);

        
        const joined = positionsFlat.concat(normalsFlat).concat(miters);
        const vertexData = Float32Array.from(joined);

        updateElementBuffer(gl, bufferInfo.element, indices);

        updatePositionBuffer(gl, bufferInfo.position, vertexData);

        drawScene(gl, programInfo, bufferInfo, frequencyData.length, uniforms);
        requestAnimationFrame(render);
        
    }
        
    requestAnimationFrame(render);

}




init();