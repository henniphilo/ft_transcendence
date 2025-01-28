
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


let scene, camera, renderer, controls;

async function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xCC0000, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 1;
	controls.maxDistance = 50;
	controls.maxPolarAngle = Math.PI / 2;

    // Load GLTF model
    const loader = new GLTFLoader();
    try {
        const loadedData = await loader.loadAsync('/u-bahn/lowpoly_berlin_u-bahn.glb');
        scene.add(loadedData.scene);
    } catch (error) {
        console.error('An error occurred while loading the model:', error);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();
