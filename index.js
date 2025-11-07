import { initializeApp } from './app.js';

// Poczekaj na załadowanie wszystkich skryptów i DOM
window.addEventListener('DOMContentLoaded', () => {
  // Dodatkowe opóźnienie, aby upewnić się, że wszystkie elementy są dostępne
  setTimeout(() => {
    initializeApp();
  }, 50);
});

// Obsługa przycisku wstecz
window.addEventListener('popstate', (event) => {
  const mainApp = document.getElementById('main-app');
  const startScreen = document.getElementById('start-screen');
  
  if (mainApp && mainApp.style.display !== 'none') {
    event.preventDefault();
    document.getElementById('change-packages-btn')?.click();
  }
});
