import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeJSManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.loader = new GLTFLoader();
        this.fbxLoader = new FBXLoader(); // FBX Loader hinzufügen
        this.ubahnModels = [];
        this.humanModel = null;
        this.mixer = null; // Animation Mixer
        this.animations = []; // Animations Array

        this.setupScene();
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff); // Hintergrund schwarz
        document.body.appendChild(this.renderer.domElement);

        // Kamera Setup
        this.camera.position.set(-1, 6, -15);
        this.camera.lookAt(0, 0, 0);

        // Beleuchtung
        const light = new THREE.PointLight(0xffffff, 2.5, 50);
        light.position.set(0, 10, 10);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        // Spotlight für mehr Kontraste
        const spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(0, 10, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.2;
        spotLight.decay = 2;
        spotLight.distance = 30;
        this.scene.add(spotLight);

        // OrbitControls hinzufügen
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;  // Sanfte Bewegungen
        this.controls.dampingFactor = 0.02;  // Reduziere für langsamere Trägheit (Standard: 0.05)
        this.controls.rotateSpeed = 0.5;      // Verlangsamt die Drehgeschwindigkeit (Standard: 1)
        this.controls.zoomSpeed = 0.5;        // Langsameres Zoomen (Standard: 1)
        this.controls.panSpeed = 0.5;         // Langsameres Panning (Standard: 1)
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI / 2; // Begrenzung nach unten

        // Spielfeld
        const fieldGeometry = new THREE.PlaneGeometry(8, 6);
        const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x4E4E4E, side: THREE.DoubleSide });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.position.set(0, 0, 0);  // Damit das Feld in XZ-Ebene bleibt
        this.scene.add(field);

        // Mittellinie
        const lineGeometry = new THREE.PlaneGeometry(0.1, 6);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.01, 0);
        this.scene.add(line);

        // Spielfeld-Begrenzungen
        const borderMaterial = new THREE.MeshStandardMaterial({ color: 'yellow' });

        const topBorder = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 0.1), borderMaterial);
        topBorder.position.set(0, 0, 3);
        this.scene.add(topBorder);

        const bottomBorder = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 0.2), borderMaterial);
        bottomBorder.position.set(0, 0, -3);
        this.scene.add(bottomBorder);
    }

    async loadModels() {
        try {
            // U-Bahn Modelle laden
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI / 2; // Begrenzung: Nicht unter das Spielfeld schauen

            const ubahnModel = await this.loadModel('looks/ubahn-bigbig.glb', {
                targetSize: 4,
                addAxesHelper: true
            });

            this.ubahnModels = [ubahnModel.clone(), ubahnModel.clone()];
            this.ubahnModels[0].position.set(-4, 0, 0);
            this.ubahnModels[1].position.set(4, 0, 0);
            this.scene.add(this.ubahnModels[0], this.ubahnModels[1]);

            this.humanModel = await this.loadModel('looks/Texting_and_Walking_turned.fbx', {
                targetSize: 1,
                addAxesHelper: true,
            });
            // this.humanModel.rotation.y = Math.PI / 2;
            this.humanModel.position.set(0, 0, 0);
            this.scene.add(this.humanModel);

            console.log("> Human geladen <");

        } catch (error) {
            console.error('Fehler beim Laden der Modelle:', error);
        }
    }

    updatePositions(gameState) {
        if (!gameState || !this.humanModel || this.ubahnModels.length !== 2) return;

        // Ballposition
        const ballX = gameState.ball[0] * 4;
        const ballZ = gameState.ball[1] * 3;

            // Check movement direction
        if (ballX < this.humanModel.position.x) {
            this.humanModel.rotation.y = Math.PI; // Facing left
        } else if (ballX > this.humanModel.position.x) {
            this.humanModel.rotation.y = 0; // Facing right
        }

        this.humanModel.position.set(ballX, 0, ballZ);

        // Spielerpositionen
        const p1Z = (gameState.player1.paddle.top + gameState.player1.paddle.bottom) / 2 * 3;
        const p2Z = (gameState.player2.paddle.top + gameState.player2.paddle.bottom) / 2 * 3;
        this.ubahnModels[0].position.z = p1Z;
        this.ubahnModels[1].position.z = p2Z;
    }

    setupRenderer(container) {
        console.log("3D Renderer Setup im Container");
        container.appendChild(this.renderer.domElement);
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
    }

    render() {
        this.controls.update();
        if (this.mixer) {
            this.mixer.update(0.01); // Zeit in Sekunden seit dem letzten Frame
        }
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        this.renderer.dispose();
    }

    loadModel(path, options = {}) {
        return new Promise((resolve, reject) => {
            const loader = path.endsWith('.glb') ? this.loader : this.fbxLoader;

            loader.load(
                path,
                (model) => {
                    let object = model; // Standardwert
                    if (path.endsWith('.glb')) {
                        object = model.scene; // GLTF hat eine Szene
                    }

                    console.log('Modell geladen:', object);

                    // Bounding Box berechnen
                    const box = new THREE.Box3().setFromObject(object);
                    const size = new THREE.Vector3();
                    box.getSize(size);

                    // Skalierung setzen
                    if (options.targetSize) {
                        const maxDimension = Math.max(size.x, size.y, size.z);
                        const scaleFactor = options.targetSize / maxDimension;
                        object.scale.set(scaleFactor, scaleFactor, scaleFactor);
                    }
                    if (options.scale) {
                        if (typeof options.scale === 'number') {
                            object.scale.set(options.scale, options.scale, options.scale);
                        } else if (Array.isArray(options.scale) && options.scale.length === 3) {
                            object.scale.set(...options.scale);
                        }
                    }

                    // Position setzen
                    if (options.position) {
                        object.position.set(...options.position);
                    } else {
                        const newBox = new THREE.Box3().setFromObject(object);
                        const center = new THREE.Vector3();
                        newBox.getCenter(center);
                        object.position.sub(center);
                    }

                    if (options.addAxesHelper) {
                        const axesHelper = new THREE.AxesHelper(5);
                        object.add(axesHelper);
                    }

                    // Animationsverarbeitung (falls vorhanden)
                    if (model.animations && model.animations.length > 0) {
                        console.log('Animationen gefunden:', model.animations);
                        this.mixer = new THREE.AnimationMixer(object);
                        this.animations = model.animations;

                        // Starte die erste Animation
                        const action = this.mixer.clipAction(this.animations[0]);
                        action.play();
                    }

                    resolve(object);
                },
                (xhr) => {
                    console.log(`${(xhr.loaded / xhr.total) * 100}% geladen`);
                },
                (error) => {
                    console.error('Fehler beim Laden des Modells:', error);
                    reject(error);
                }
            );
        });
    }
}
