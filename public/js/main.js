import { m4 } from "./matrix.js";
import { resizeCanvasToDisplaySize } from "./canvas.js";
import { createShader, createProgram, initBuffers } from "./webglutils.js";

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying highp vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * a_position;

    v_texcoord = a_texcoord;
}`;

const fragmentShaderSource = `
varying highp vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}`;

function radToDeg(r) {
    return (r * 180) / Math.PI;
}

function degToRad(d) {
    return (d * Math.PI) / 180;
}

function main() {
    window.addEventListener("resize", drawScene);
    window.addEventListener("mousemove", event => {
        // clientX: 0 -> rotDegY: -30
        // clientX: clientWidth -> rotDegY: 30
        const windowWidth = window.innerWidth;
        state.rotDegY = ((event.clientX - windowWidth / 2) / (windowWidth / 2)) * 30;
        state.rotRadY = degToRad(state.rotDegY);

        // clientY: 0 -> rotDegX: -20
        // clientY: clientHeight -> rotDegX: 40
        // rotOffsetX: 10
        const windowHeight = window.innerHeight;
        state.rotDegX = ((event.clientY - windowHeight / 2) / (windowHeight / 2)) * 30 + 10;
        state.rotRadX = degToRad(state.rotDegX);

        drawScene();
    });

    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#c");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        fieldOfViewRadians: degToRad(60),
        fieldOfViewDeg: 60,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        posX: 0,
        posY: 0,
        posZ: -6,
        rotDegX: 0,
        rotDegY: 30,
        rotDegZ: 0,
        rotRadX: degToRad(0),
        rotRadY: degToRad(30),
        rotRadZ: degToRad(0),
        scaleX: 1.7,
        scaleY: 1.7,
        scaleZ: 1.7
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup GLSL program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const textureLocation = gl.getUniformLocation(program, "u_texture");

    const buffers = initBuffers(gl);

    // Load texture
    const texture = loadTexture(gl, "/static/img/me.jpg", () => drawScene());
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    drawScene();

    /**
     * Draws the scene.
     */
    function drawScene() {
        resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Enable the depth buffer
        gl.enable(gl.DEPTH_TEST);

        // Turn on culling. By default backfacing triangles
        // will be culled.
        gl.enable(gl.CULL_FACE);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Compute the matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = 2000;
        let matrix = m4.perspective(state.fieldOfViewRadians, aspect, zNear, zFar);

        matrix = m4.translate(matrix, state.posX, state.posY, state.posZ);
        matrix = m4.xRotate(matrix, state.rotRadX);
        matrix = m4.yRotate(matrix, state.rotRadY);
        matrix = m4.zRotate(matrix, state.rotRadZ);
        matrix = m4.scale(matrix, state.scaleX, state.scaleY, state.scaleZ);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(textureLocation, 0);

        // draw elements
        const vertexCount = 6 * 6; // 6 Faces * 6 Vertices
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

/**
 * Loads the texture
 * @param {WebGLRenderingContext} gl
 * @param {string} textureSrc
 * @param {CallableFunction} onLoadCallback
 * @returns {WebGLTexture | null}
 */
function loadTexture(gl, textureSrc, onLoadCallback) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Asynchronously load an image
    const image = new Image();
    image.src = textureSrc;
    image.addEventListener("load", function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        onLoadCallback();
    });

    return texture;
}

main();
