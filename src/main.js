import Experience from './experience/Experience.js';
import UIController from './ui/UIController.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  if (canvas) {
    const experience = new Experience(canvas);
    const uiController = new UIController(experience);

    console.log("✨ Molly Arora • 3D Portfolio Loaded Successfully!");
  }
});
