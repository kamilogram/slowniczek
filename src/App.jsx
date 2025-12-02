import React, { useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { useWakeLock } from './hooks/useWakeLock';
import StartScreen from './components/StartScreen';
import MainApp from './components/MainApp';
import { loadFromStorage, saveToStorage } from './services/storage';
import './index.css';

function App() {
  const gameLogic = useGameLogic();
  const { requestWakeLock } = useWakeLock();

  useEffect(() => {
    // Check dark mode
    const savedDarkMode = loadFromStorage('slowkaDarkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    saveToStorage('slowkaDarkMode', isDark ? 'true' : 'false');
  };

  const handleStart = (localIds, customWords, remoteNames) => {
    gameLogic.startGame(localIds, customWords, remoteNames);
    requestWakeLock();
  };

  const handleChangePackages = () => {
    gameLogic.setGameState('start');
    // Stop auto mode if active
    if (gameLogic.autoMode) {
      gameLogic.toggleAutoMode();
    }
  };

  return (
    <>
      {gameLogic.gameState === 'start' && (
        <StartScreen
          localPackagesConfig={gameLogic.localPackagesConfig}
          remoteSets={gameLogic.remoteSets}
          refreshRemoteSets={gameLogic.refreshRemoteSets}
          onStart={handleStart}
          selectedPackages={gameLogic.selectedPackages}
          setSelectedPackages={gameLogic.setSelectedPackages}
          customWordsInput={gameLogic.customWordsInput}
          setCustomWordsInput={gameLogic.setCustomWordsInput}
        />
      )}

      {gameLogic.gameState === 'quiz' && (
        <MainApp
          gameLogic={gameLogic}
          onChangePackages={handleChangePackages}
          toggleDarkMode={toggleDarkMode}
        />
      )}
    </>
  );
}

export default App;
