import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeJSManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.loader = new GLTFLoader();

        this.ubahnModels = [];
        this.humanModel = null;

        this.setupScene();
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 10);
        this.scene.add(light);
    }

    loadModels() {
        return new Promise((resolve, reject) => {
            this.loader.load('u-bahn/lowpoly_berlin_u-bahn.glb', (gltf) => {
                const ubahnModel = gltf.scene;
                this.ubahnModels = [ubahnModel.clone(), ubahnModel.clone()];
                this.ubahnModels[0].position.set(-4, 0, 0);
                this.ubahnModels[1].position.set(4, 0, 0);
                this.scene.add(this.ubahnModels[0], this.ubahnModels[1]);

                this.loader.load('u-bahn/woman_walking.glb', (gltf) => {
                    this.humanModel = gltf.scene;
                    this.humanModel.scale.set(0.1, 0.1, 0.1);
                    this.scene.add(this.humanModel);
                    resolve();
                }, undefined, reject);
            }, undefined, reject);
        });
    }

    updatePositions(gameState) {
        if (!this.humanModel || this.ubahnModels.length !== 2) return;

        const ballX = gameState.ball[0] * 4;
        const ballY = gameState.ball[1] * 3;
        this.humanModel.position.set(ballX, ballY, 0);

        const p1Y = (gameState.player1.paddle.top + gameState.player1.paddle.bottom) / 2 * 3;
        const p2Y = (gameState.player2.paddle.top + gameState.player2.paddle.bottom) / 2 * 3;
        this.ubahnModels[0].position.y = p1Y;
        this.ubahnModels[1].position.y = p2Y;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        this.renderer.dispose();
    }
}
