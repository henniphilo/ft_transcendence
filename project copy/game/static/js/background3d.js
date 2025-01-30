import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;

function init() {
    const canvas = document.getElementById('background-canvas');

    // Initialize scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    // Position camera
    camera.position.z = 5;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load(
        'ubahn/lowpoly_berlin_u-bahn_station.glb',
        (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.position.set(0, -1, -5); // Adjust position
            gltf.scene.scale.set(1, 1, 1);     // Adjust scale if needed
        },
        undefined,
        (error) => console.error('Error loading model:', error)
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Render scene
    renderer.render(scene, camera);
}

export function initBackground3D() {
    init();
}
