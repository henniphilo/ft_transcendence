import { initBackground3D } from './background3d.js';
import { MenuDisplay } from './displayMenu.js';

document.addEventListener('DOMContentLoaded', () => {
   initBackground3D(); // Initialize the Three.js background
   new MenuDisplay(); // Initialize the menu system
});
