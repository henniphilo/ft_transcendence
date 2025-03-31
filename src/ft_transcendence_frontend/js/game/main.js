import { initBackground3D } from './background3d.js';
import { MenuDisplay } from './displayMenu.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    const canvas = document.getElementById('background-canvas');
    if (!canvas) {
        console.error("❌ Error: #background-canvas not found in the DOM!");
        return;
    }

    console.log("✅ Background canvas found, initializing 3D background...");

    // Erst 3D starten, danach Menü
    initBackground3D(() => {
        console.log("✅ Initializing Menu System...");
        new MenuDisplay();
    });
});

