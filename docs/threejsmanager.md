## ThreeJSManager.js

The `ThreeJSManager` class manages the 3D rendering and game environment using [Three.js](https://threejs.org/). It is responsible for setting up the scene, handling user inputs, loading 3D models and textures, managing audio feedback, and updating object positions during the game loop.

###  Features

- **Scene Initialization**
  - Sets up camera, renderer, lighting, and basic game geometry.
  - Uses `OrbitControls` for smooth camera navigation.

- **Responsive Design**
  - Handles `resize` events to update aspect ratio and renderer size.
  - Optional camera perspective changes with keys `1`, `2`, `3`.

- **Model Loading**
  - Supports `.glb` and `.fbx` formats using `GLTFLoader` and `FBXLoader`.
  - Includes dynamic resizing and positioning logic.
  - Loads a subway model, paddles, bench, ticket machine, and an animated human character.

- **Game Field Setup**
  - Adds a game field, background texture, borders, middle line, and lighting.
  - Uses cloned models to place symmetrical elements (e.g., railway lines).

- **Player Paddle Management**
  - Renders two versions of player paddles:
    - Custom subway 3D paddles (`paddleModels`)
    - Basic colored box paddles (`paddleModels2`) for scaling logic.

- **Audio Integration**
  - Uses `AudioListener` and a custom `AudioManager` for sound effects:
    - `'start'`: Played when game loads.
    - `'game'`: Looping background audio.
    - `'bounce'`: Played when the ball hits.
    - `'win'`: Played when a player scores.

- **Dynamic Updates**
  - Updates positions of ball (via `humanModel`) and paddles based on `gameState`.
  - Adjusts paddle height dynamically according to game progress.
  - Handles character orientation based on ball direction.

- **Renderer Setup & Cleanup**
  - Can be embedded into a given HTML container.
  - Disposes of renderer resources cleanly when no longer needed.

###  Usage

```js
import { ThreeJSManager } from './ThreeJSManager.js';

const manager = new ThreeJSManager();
await manager.loadModels();        // Load all assets
manager.setupRenderer(container);  // Embed renderer
manager.render();                  // Start rendering loop
