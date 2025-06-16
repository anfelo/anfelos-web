import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const backgroundEl = document.querySelector("#background");
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

const scene = new THREE.Scene();

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

const loader = new THREE.TextureLoader();
const texture = loader.load("/static/img/me.jpg");
texture.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.BoxGeometry(state.scaleX, state.scaleY, state.scaleZ);
const material = new THREE.MeshBasicMaterial({ map: texture });
const cube = new THREE.Mesh(geometry, material);
cube.translateY(state.posY);
scene.add(cube);

const modelPaths = [
    "/static/models/tree_pineSmallD.glb",
    "/static/models/tree_pineSmallC.glb",
    "/static/models/tree_small_dark.glb"
];

const gltfLoader = new GLTFLoader();

function loadModels(modelPaths) {
    return Promise.all(
        modelPaths.map(
            path =>
                new Promise((resolve, reject) => {
                    gltfLoader.load(path, gltf => resolve(gltf.scene), undefined, reject);
                })
        )
    );
}

// loadModels(modelPaths)
//     .then(models => {
//         if (!models.length) {
//             return;
//         }
//         for (let i = 0; i < 10; i++) {
//             const posY = i * 0.6 - 1;
//             for (let j = 0; j < 4; j++) {
//                 const clone = models[Math.floor(Math.random() * models.length)].clone();
//                 clone.position.set(Math.random() + 3, -posY, Math.random() + i);
//
//                 const scale = Math.random() * 0.5 + 0.5;
//                 clone.scale.set(scale, scale, scale);
//
//                 scene.add(clone);
//             }
//
//             for (let j = 0; j < 4; j++) {
//                 const clone = models[Math.floor(Math.random() * models.length)].clone();
//                 clone.position.set(-1 * (Math.random() + 3), -posY, Math.random() + i);
//
//                 const scale = Math.random() * 0.5 + 0.5;
//                 clone.scale.set(scale, scale, scale);
//
//                 scene.add(clone);
//             }
//         }
//     })
//     .catch(error => console.error("Error loading models:", error));

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
    cube.rotation.x = state.rotRadX;
    cube.rotation.y = state.rotRadY;

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

    renderer.setSize(backgroundElRect.width, backgroundElRect.height);
}

function degToRad(d) {
    return (d * Math.PI) / 180;
}
