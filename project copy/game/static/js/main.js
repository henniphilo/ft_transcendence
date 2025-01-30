import { initBackground3D } from './background3D.js';
import './displayMenu.js'; // Assuming displayMenu.js initializes itself on DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
   initBackground3D(); // Initialize the Three.js background
   new MenuDisplay(); // Initialize the menu system
});
