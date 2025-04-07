import { initBackground3D } from './background3d.js';
import { backgroundAudioManager } from './background3d.js';
import { MenuDisplay } from './displayMenu.js';

let musicEnabled = true;

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

    const toggleButton = document.getElementById('toggle-music-button');

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const music = backgroundAudioManager.getSound('background');
            if (!music) return;

            if (music.isPlaying) {
                music.pause();
                toggleButton.textContent = '🔇 Musik: Aus';
                musicEnabled = false;
            } else {
                music.play();
                toggleButton.textContent = '🔊 Musik: An';
                musicEnabled = true;
            }
        });
    }
});


