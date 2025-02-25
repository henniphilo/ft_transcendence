import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeJSManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('keydown', this.preventArrowKeyScrolling.bind(this));

        this.loader = new GLTFLoader();
        this.fbxLoader = new FBXLoader(); // FBX Loader hinzufügen
        this.ubahnModels = [];
        this.currentUbahnSize = null; // Speichert die aktuelle Größe
        this.humanModel = null;
        this.mixer = null; // Animation Mixer
        this.animations = []; // Animations Array

        this.setupScene();
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
     //   this.renderer.setClearColor('yellow');
        document.body.appendChild(this.renderer.domElement);

        // Game Background Texture
        const loader = new THREE.TextureLoader();
        const bgTexture = loader.load('looks/fahrscheinebitte1.jpg');
        this.scene.background = bgTexture;

        // Kamera Setup
        this.camera.position.set(-1, 3, -10);
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
        const fieldMaterial = new THREE.MeshStandardMaterial({ color: 'lightgrey', side: THREE.DoubleSide });
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    preventArrowKeyScrolling(event) {
        const keysToPrevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (keysToPrevent.includes(event.key)) {
            event.preventDefault();
        }
    }

    async loadModels() {
        try {
                    // Warte, bis die WebSocket-Verbindung steht
        if (!this.gameState || !this.gameState.settings || !this.gameState.settings.paddle_size) {
            console.log("Warte auf WebSocket-Daten für das U-Bahn-Modell...");
            return;  // Modell erst laden, wenn die Daten da sind
        }
            await this.loadUbahnModel(this.gameState.settings.paddle_size); // Standardmodell laden
            await this.loadHumanModel(); // Menschliches Modell laden
            console.log("Modelle geladen");
        } catch (error) {
            console.error("Fehler beim Laden der Modelle:", error);
        }
    }


    async loadUbahnModel(paddleSize) {
    // Mapping der Backend-Werte auf die ThreeJS-Modelle
        const sizeMapping = {
            small: "small",
            middle: "medium",  // Backend „middle“ -> ThreeJS „medium“
            big: "large"        // Backend „big“ -> ThreeJS „large“
        };

        const mappedSize = sizeMapping[paddleSize] || "medium"; // Falls unbekannt, Standard „medium“

        console.log(`Lade U-Bahn Modell für '${mappedSize}' (Backend-Wert: '${paddleSize}')`);

        const modelPaths = {
            small: "looks/ubahn-short1.glb",
            medium: "looks/ubahn-bigbig.glb",
            large: "looks/ubahn-bigbig.glb"
        };
        const modelPath = modelPaths[mappedSize];

        if (this.currentUbahnSize === mappedSize) return; // Bereits geladen? Dann abbrechen.
        this.currentUbahnSize = mappedSize;

        try {
            const ubahnModel = await this.loadModel(modelPath, { targetSize: 3 });
            this.ubahnModels = [ubahnModel.clone(), ubahnModel.clone()];
            this.ubahnModels[0].position.set(-4, 0, 0);
            this.ubahnModels[1].position.set(4, 0, 0);
            this.scene.add(this.ubahnModels[0], this.ubahnModels[1]);

            const boxHelper = new THREE.BoxHelper(this.ubahnModels[0], 0xff0000);
            this.scene.add(boxHelper);

            console.log(`U-Bahn Modell '${mappedSize}' erfolgreich geladen.`);
        } catch (error) {
            console.error("Fehler beim Laden des U-Bahn Modells:", error);
        }
        }


            // // Neue U-Bahn Modelle laden
            // const [model1, model2] = await Promise.all([
            //     this.loadModel(settings.model),
            //     this.loadModel(settings.model),
            // ]);

            // Alte Modelle aus der Szene entfernen
            // if (this.ubahnModels.length === 2) {
            //     this.scene.remove(this.ubahnModels[0], this.ubahnModels[1]);
            // }

            // // Neue Modelle hinzufügen
            // model1.position.set(-4, 0, 0);
            // model2.position.set(4, 0, 0);
            // this.ubahnModels = [model1, model2];
            // this.scene.add(model1, model2);


    async loadHumanModel() {
        try {
            const modelPath = "looks/womanwalkturn-XXXX.fbx"; // Pfad zum Modell anpassen

            // Modell laden
            const human = await this.loadModel(modelPath, { targetSize: 0.7 });
            human.position.set(0, 0, 0); // Startposition setzen

            // Falls bereits ein Human-Modell existiert, altes Modell entfernen
            if (this.humanModel) {
                this.scene.remove(this.humanModel);
            }
            this.humanModel = human;
            this.scene.add(this.humanModel);

            // Animationen initialisieren, falls vorhanden
            if (this.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.humanModel);
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }

            console.log("> Human Model geladen & in Szene gesetzt <");
        } catch (error) {
            console.error("Fehler beim Laden des Human Model:", error);
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
            this.mixer.update(0.01);
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
                 //   console.log(`${(xhr.loaded / xhr.total) * 100}% geladen`);
                },
                (error) => {
                    console.error('Fehler beim Laden des Modells:', error);
                    reject(error);
                }
            );
        });
    }
}
