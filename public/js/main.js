import * as THREE from "three";

const backgroundEl = document.querySelector("#background");

const vertexShader = `
varying vec2 v_uvs;

void main() {
    // position, projectionMatrix, modelViewMatrix are provided by THREE.js
    vec4 localPosition = vec4(position, 1.0);

    gl_Position = localPosition;
    v_uvs = uv;
}
`;

const fragmentShader = `
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 v_uvs;

float inverse_lerp(float v, float min_value, float max_value) {
    return (v - min_value) / (max_value - min_value);
}

float remap(float v, float in_min, float in_max, float out_min, float out_max) {
    float t = inverse_lerp(v, in_min, in_max);
    return mix(out_min, out_max, t);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

// Copyright (C) 2011 by Ashima Arts (Simplex noise)
// Copyright (C) 2011-2016 by Stefan Gustavson (Classic noise and others)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://github.com/ashima/webgl-noise/tree/master/src
vec3 mod289(vec3 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 mod289(vec4 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 permute(vec4 x)
{
    return mod289((x * 34.0 + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - r * 0.85373472095314;
}

vec4 snoise(vec3 v)
{
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

    // First corner
    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v   - i + dot(i, vec3(C.x));

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + C.y;
    vec3 x3 = x0 - 0.5;

    // Permutations
    i = mod289(i); // Avoid truncation effects in permutation
    vec4 p =
      permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    vec4 j = p - 49.0 * floor(p / 49.0);  // mod(p,7*7)

    vec4 x_ = floor(j / 7.0);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);

    // Normalize gradients
    vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
    g0 *= norm.x;
    g1 *= norm.y;
    g2 *= norm.z;
    g3 *= norm.w;

    // Compute noise and gradient at P
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m3 = m2 * m;
    vec4 m4 = m2 * m2;
    vec3 grad =
      -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
      -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
      -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
      -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
    vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
    return 42.0 * vec4(grad, dot(m4, px));
}

// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/
//
// https://www.shadertoy.com/view/Xsl3Dl
vec3 hash3( vec3 p ) // replace this by something better
{
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
            dot(p,vec3(269.5,183.3,246.1)),
            dot(p,vec3(113.5,271.9,124.6)));

    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );

    vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash3( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ),
                          dot( hash3( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash3( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ),
                          dot( hash3( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash3( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ),
                          dot( hash3( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash3( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ),
                          dot( hash3( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

float fbm(vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
    float amplitude = 0.5;
    float frequency = 1.0;
    float total = 0.0;
    float normalization = 0.0;

    for (int i = 0; i < octaves; ++i) {
        float noiseValue = snoise(p * frequency).w;
        total += noiseValue * amplitude;
        normalization += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    total /= normalization;
    total = total * 0.5 + 0.5;
    total = pow(total, exponentiation);

    return total;
}

vec3 generate_grid_stars(vec2 pixel_coords, float star_radius, float cell_width, float seed, bool
twinkle) {
    vec2 cell_coords = (fract(pixel_coords / cell_width) - 0.5) * cell_width;
    vec2 cell_id = floor(pixel_coords / cell_width) + seed / 100.0;
    vec3 cell_hash_value = hash3(vec3(cell_id, 0.0));

    float star_brightness = saturate(cell_hash_value.z);
    vec2 star_position = vec2(0.0);
    star_position += cell_hash_value.xy * (cell_width * 0.5 - star_radius * 4.0);
    float dist_to_star = length(cell_coords - star_position);
    //float glow = smoothstep(star_radius + 1.0, star_radius, dist_to_star);
    float glow = exp(-2.0 * dist_to_star / star_radius);

    if (twinkle) {
        float noise_sample = noise(vec3(cell_id, u_time * 1.5));
        float twinkle_size = remap(noise_sample, -1.0, 1.0, 1.0, 0.1) * star_radius * 6.0;
        vec2 abs_dist = abs(cell_coords - star_position);
        float twinkle_value = smoothstep(star_radius * 0.25, 0.0, abs_dist.y) *
                              smoothstep(twinkle_size, 0.0, abs_dist.x);
        twinkle_value += smoothstep(star_radius * 0.25, 0.0, abs_dist.x) *
                              smoothstep(twinkle_size, 0.0, abs_dist.y);
        glow += twinkle_value;
    }

    return vec3(glow * star_brightness);
}

vec3 generate_stars(vec2 pixel_coords) {
    vec3 stars = vec3(0.0);

    float size = 4.0;
    float cell_width = 500.0;
    for (float i = 0.0; i < 2.0; ++i) {
        stars += generate_grid_stars(pixel_coords, size, cell_width, i, true);
        size *= 0.5;
        cell_width *= 0.35;
    }

    for (float i = 2.0; i < 5.0; ++i) {
        stars += generate_grid_stars(pixel_coords, size, cell_width, i, false);
        size *= 0.5;
        cell_width *= 0.35;
    }

    return stars;
}

float sdf_circle(vec2 p, float r) {
    return length(p) - r;
}

float map(vec3 pos) {
    return fbm(pos, 6, 0.5, 2.0, 4.0);
}

vec3 calc_normal(vec3 pos, vec3 n) {
  vec2 e = vec2(0.0001, 0.0);
  return normalize(
      n + -500.0 * vec3(
          map(pos + e.xyy) - map(pos - e.xyy),
          map(pos + e.yxy) - map(pos - e.yxy),
          map(pos + e.yyx) - map(pos - e.yyx)
      )
  );
}

mat3 rotate_y(float radians) {
  float s = sin(radians);
  float c = cos(radians);
  return mat3(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c);
}

void main() {
    vec2 pixel_coords = vec2(v_uvs - 0.5) * u_resolution;

    vec3 color = vec3(0.0);
    color = generate_stars(pixel_coords);

    gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
`;

function main() {
    if (!backgroundEl) {
        return;
    }

    const backgroundElRect = backgroundEl.getBoundingClientRect();
    const state = {
        posX: 0,
        posY: 2.75,
        posZ: 0,
        rotDegX: 0,
        rotDegY: 30,
        rotDegZ: 0,
        rotRadX: degToRad(0),
        rotRadY: degToRad(30),
        rotRadZ: degToRad(0),
        scaleX: 0.8,
        scaleY: 0.8,
        scaleZ: 0.8
    };

    const clock = new THREE.Clock(true);

    const scene = new THREE.Scene();
    scene.background = null;

    const aspect = backgroundElRect.width / backgroundElRect.height;
    const frustum = 8;
    const cameraZoom = frustum / 2;
    const camera = new THREE.OrthographicCamera(
        -cameraZoom * aspect,
        cameraZoom * aspect,
        cameraZoom,
        -cameraZoom,
        1,
        1000
    );
    camera.position.set(0, 2, 20);
    camera.lookAt(scene.position);

    const renderer = new THREE.WebGLRenderer();
    // Trick to render both the background and the main scene
    renderer.autoClearColor = false;
    renderer.autoClearDepth = true;

    renderer.setSize(backgroundElRect.width, backgroundElRect.height);
    renderer.setAnimationLoop(animate);
    backgroundEl.appendChild(renderer.domElement);

    window.addEventListener("resize", () => onWindowResize(), false);
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
        state.rotDegX = ((event.clientY - windowHeight / 2) / (windowHeight / 2)) * 30 - 10;
        state.rotRadX = degToRad(state.rotDegX);
    });

    // Background
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const bgUniforms = {
        u_resolution: { value: [backgroundElRect.width, backgroundElRect.height] },
        u_time: { value: 0 }
    };

    const bgMaterial = new THREE.ShaderMaterial({
        uniforms: bgUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        depthWrite: false
    });

    const bgGeometry = new THREE.PlaneGeometry(2, 2);

    const plane = new THREE.Mesh(bgGeometry, bgMaterial);
    bgScene.add(plane);

    const loader = new THREE.TextureLoader();
    const texture = loader.load("/static/img/me.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.BoxGeometry(state.scaleX, state.scaleY, state.scaleZ);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    cube.translateY(state.posY);
    scene.add(cube);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight1.position.set(5, 10, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 10, 5);
    scene.add(directionalLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    scene.background = new THREE.Color(0x13171f);

    function animate() {
        const elapsedTime = clock.getElapsedTime();

        bgUniforms.u_time.value = elapsedTime;

        cube.rotation.x = state.rotRadX;
        cube.rotation.y = state.rotRadY;

        // Disable depth clearing so main scene renders on top
        renderer.autoClearColor = true;
        renderer.render(bgScene, bgCamera);

        renderer.autoClearColor = false;
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        const backgroundElRect = backgroundEl.getBoundingClientRect();

        // This works for OrthographicCamera resizing.
        const aspect = backgroundElRect.width / backgroundElRect.height;
        camera.left = -aspect * cameraZoom;
        camera.right = aspect * cameraZoom;
        camera.top = cameraZoom;
        camera.bottom = -cameraZoom;
        camera.updateProjectionMatrix();

        bgUniforms.u_resolution.value = [backgroundElRect.width, backgroundElRect.height];

        renderer.setSize(backgroundElRect.width, backgroundElRect.height);
    }

    function degToRad(d) {
        return (d * Math.PI) / 180;
    }
}

main();
