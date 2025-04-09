import * as THREE from 'three';
import { AudioManager, getGlobalAudioManager, setGlobalAudioManager } from './audioManger.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let backgroundAudioManager = null;
export { backgroundAudioManager };

let scene, camera, renderer, controls;
let model;
let particles;
let cameraSpeed = 0.005;
let cameraMoveRight = 0.002;
let cameraMoveUp = 0.001;

export function initBackground3D(onLoadedCallback) {
    console.log("in initBackground3D");
    const canvas = document.getElementById('background-canvas');

    // Szene, Kamera und Renderer initialisieren
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // // Background Musik starten
    const listener = new THREE.AudioListener();
    camera.add(listener);

    let globalManager = getGlobalAudioManager();
    if (!globalManager) {
        console.warn("⚠️ Kein globaler AudioManager gefunden, neue Instanz wird erstellt.");
        backgroundAudioManager = new AudioManager(listener);
        setGlobalAudioManager(backgroundAudioManager);
    } else {
        backgroundAudioManager = globalManager;
    }

    backgroundAudioManager.loadSound('background', '/sounds/HeavyJam_©PlasticPigs.mp3', {
        loop: true
    }).then(() => {
        document.addEventListener('click', () => {
            backgroundAudioManager.playSound('background');
        }, { once: true });

        if (onLoadedCallback) onLoadedCallback();
    });


    // Kamera-Position setzen
    camera.position.z = 5;

    // Lichtquellen hinzufügen
    const ambientLight = new THREE.AmbientLight(0xfff0e0, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xe0f0ff, 0.4);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Orbit Controls aktivieren
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // Model laden
    const loader = new GLTFLoader();
    loader.load(
        'looks/transform_u-station.glb',
        (gltf) => {
            model = gltf.scene;
            scene.add(model);
            model.position.set(0, -1, 0);
            model.scale.set(1, 1, 1);

            console.log("✅ 3D Model loaded!");
            if (onLoadedCallback) {
                onLoadedCallback(); // Login-Menü jetzt starten!
            }
        },
        (xhr) => {
   //         console.log((xhr.loaded / xhr.total * 100) + '% background loaded');
        },
        (error) => console.error('Error loading background model:', error)
    );

    // Partikel hinzufügen
    addParticles();

    // Event Listener für Fenstergröße und Mausbewegung
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);

    // Start der Animation
    animate();
}

function addParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const size = 2000;

    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * size;
        const y = (Math.random() - 0.5) * size;
        const z = (Math.random() - 0.5) * size;
        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    if (model) {
        model.rotation.y = mouseX * 0.1;
        model.rotation.x = mouseY * 0.1;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    camera.position.z -= cameraSpeed;
    camera.position.x += cameraMoveRight;
    camera.position.y += cameraMoveUp;

    if (particles) {
        particles.rotation.y += 0.0005;
    }

    renderer.render(scene, camera);
}


