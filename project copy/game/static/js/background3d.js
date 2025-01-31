import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let cameraSpeed = 0.005;
let cameraMoveRight = 0.002;
let cameraMoveUp = 0.001;


function init() {
	console.log("in init");
    const canvas = document.getElementById('background-canvas');

    // Initialize scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    // Position camera
    camera.position.z = 5;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xfff0e0, 0.7);
    scene.add(ambientLight);

	// Main directional light (simulating sunlight)
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(5, 10, 7);
	scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xe0f0ff, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);


    // Load GLB model
    const loader = new GLTFLoader();

    loader.load(
        'ubahn/transform_u-station.glb',
        (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.position.set(0, -1, 0); // Adjust position
            gltf.scene.scale.set(1, 1, 1);     // Adjust scale if needed
        },
        undefined,
        (error) => console.error('Error loading model:', error)
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    camera.position.z -= cameraSpeed;
    camera.position.x += cameraMoveRight;
    camera.position.y += cameraMoveUp;

    // Optionale Begrenzung, damit die Kamera nicht zu nah an die Szene kommt
    // if (camera.position.y < 1) {
    //     camera.position.y = 1;
    // }
    // Render scene
    renderer.render(scene, camera);
}

export function initBackground3D() {
    init();
}
