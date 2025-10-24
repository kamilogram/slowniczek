import { initializeApp } from './app.js';

// Poczekaj na załadowanie wszystkich skryptów i DOM
window.addEventListener('DOMContentLoaded', () => {
  // Dodatkowe opóźnienie, aby upewnić się, że wszystkie elementy są dostępne
  setTimeout(() => {
    initializeApp();
  }, 50);
});
