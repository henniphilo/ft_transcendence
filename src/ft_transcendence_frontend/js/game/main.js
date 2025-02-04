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
   initBackground3D(); // Initialize the Three.js background

   console.log("✅ Initializing Menu System...");
   new MenuDisplay(); // Initialize the menu system
});

