import React, { useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { useWakeLock } from './hooks/useWakeLock';
import StartScreen from './components/StartScreen';
import MainApp from './components/MainApp';
import { loadFromStorage, saveToStorage } from './services/storage';
import { getVoices } from './services/speech';
import './index.css';

function App() {
  const gameLogic = useGameLogic();
  // Automatically activate wake lock when game is active
  const isGameActive = gameLogic.gameState === 'quiz';
  const { requestWakeLock, releaseWakeLock } = useWakeLock(isGameActive);

  useEffect(() => {
    // Check dark mode
    const savedDarkMode = loadFromStorage('slowkaDarkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Pre-initialize speech synthesis to ensure it's ready when needed
    // This is especially important for mobile browsers that require user interaction
    getVoices().catch(e => {
      console.warn('Failed to pre-initialize speech synthesis:', e);
    });
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    saveToStorage('slowkaDarkMode', isDark ? 'true' : 'false');
  };

  const handleStart = async (localIds, customWords, remoteNames) => {
    await gameLogic.startGame(localIds, customWords, remoteNames);
    // Wake lock will be automatically activated via isGameActive
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
