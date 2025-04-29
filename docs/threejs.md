# 3D Game Visualization with Three.js

This project uses [Three.js](https://threejs.org/) to render an interactive 3D game environment inside the browser. It leverages various Three.js components to display models, animate objects, handle user interactions, and play sounds — all in real time.

---

## Architecture Overview

The core logic is encapsulated in the `ThreeJSManager` class (`ThreeJSManager.js`), which is responsible for:

- Initializing the scene
- Setting up lighting and camera
- Loading 3D models
- Managing audio
- Updating game visuals based on real-time state

---

## Main Components

### `Three.Scene`
A single global scene object holds all visual elements — background, paddles, ball (human), environment models.

### `Three.PerspectiveCamera`
A perspective camera is configured with adjustable viewpoints. Users can switch between:
- Player 1 view
- Player 2 view
- Top-down bird's-eye view

### `Three.WebGLRenderer`
Handles rendering of the scene and integrates with the browser's canvas.

### `OrbitControls`
Allows users to rotate and zoom the camera when appropriate (with damping).

### `GLTFLoader` & `FBXLoader`
Used for importing `.glb` and `.fbx` 3D models like:
- Subway (U-Bahn) paddles
- Animated human player
- Bench, Ticket machine, Railway tracks

### `AudioManager`
A custom audio manager (`audioManager.js`) wraps Three.js audio features to handle:
- Sound loading
- Volume control
- Looping
- Playback control on events (e.g., ball bounce or player win)

---

## Game Field Design

The playing field is a 3D plane with:

- Textured background (`fahrscheinebitte2.jpg`)
- Subdivided into two paddle zones and a centerline
- Custom borders and lighting for enhanced realism
- Environment elements placed using cloned models (railways, benches, machines)

---

## Paddle & Ball System

### Ball → Human Model
Instead of a basic sphere, a 3D animated human model represents the ball, moving and rotating based on ball direction.

### Paddle Types
- **Primary**: Subway models used as interactive paddles.
- **Secondary**: Box-based paddles (`paddleModels2`) with adjustable height for visual feedback.

All paddle and ball positions update dynamically using `updatePositions(gameState)` based on incoming real-time data.

---

## Sound Integration

Audio events are tied to gameplay:

| Event                | Sound                     |
|----------------------|---------------------------|
| Game start           | `Mehringdamm.mp3`         |
| Ball bounce          | `boing-2-44164.mp3`       |
| Player scores        | `girl-scream-45657.mp3`   |
| Background Main Page | `ToyCars_©PlasticPigs.mp3` (looped)
| Background Game      | `HeavyJam_©PlasticPigs.mp3` (looped)


---

## Animation

If the loaded 3D models contain animation clips (e.g., walking), the first animation is automatically played using `THREE.AnimationMixer`.

---

## Controls

| Key | Effect               |
|-----|----------------------|
| `1` | Switch to Player 1   |
| `2` | Switch to Player 2   |
| `3` | Bird’s-eye view      |
| Arrows | Prevent page scroll |

---

## Resource Management

- Dynamically disposes and resets geometry for performance and responsiveness.
- Clones objects when reusing (e.g., subway rails).
- Separates field and game models for clarity.

---

## Usage Example

```js
import { ThreeJSManager } from './ThreeJSManager.js';

const manager = new ThreeJSManager();

await manager.loadModels();
manager.setupRenderer(document.getElementById('game-container'));

function animate() {
  requestAnimationFrame(animate);
  manager.render();
}
animate();
