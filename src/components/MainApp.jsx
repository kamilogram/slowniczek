import React, { useEffect } from 'react';
import FlashCard from './FlashCard';
import Controls from './Controls';
import AutoModeSettings from './AutoModeSettings';

export default function MainApp({
  gameLogic,
  onChangePackages,
  toggleDarkMode
}) {
  const {
    current,
    previous,
    wasSkipped,
    usedCount,
    totalCount,
    showAnswer,
    nextWord,
    restart,
    undo,
    autoMode,
    toggleAutoMode,
    autoTimeLeft,
    timerVisible,
    setTimerVisible,
    answerLanguage,
    setAnswerLanguage,
    clearUsedHistory
  } = gameLogic;

  // Handle keyboard shortcuts if needed, but original didn't seem to have them explicitly in app.js (maybe I missed them)
  // Original app.js didn't have keyboard listeners.

  return (
    <div className="main-app">
      <div className="card">
        <p id="progress">{usedCount} / {totalCount}</p>

        <FlashCard
          current={current}
          showAnswer={wasSkipped}
          previous={previous}
        />

        <Controls
          onSkip={showAnswer}
          onNext={nextWord}
          onRestart={restart}
          onUndo={undo}
          showAnswer={wasSkipped}
          autoMode={autoMode}
          onToggleAutoMode={toggleAutoMode}
          onToggleDarkMode={toggleDarkMode}
          onChangePackages={onChangePackages}
          onClearUsed={clearUsedHistory}
          hasPrevious={!!previous}
          gameFinished={!current}
        />

        <AutoModeSettings visible={autoMode} />

        <select
          id="answer-lang-select"
          style={{ display: 'none' }} // Hidden in original UI unless needed, actually it was hidden in HTML: style="display:none;"
          value={answerLanguage}
          onChange={(e) => setAnswerLanguage(e.target.value)}
        >
          <option value="en-US">Angielski</option>
          <option value="pl-PL">Polski</option>
          <option value="es-ES">Hiszpański</option>
          <option value="it-IT">Włoski</option>
          <option value="fr-FR">Francuski</option>
        </select>

        {autoMode && (
          <div className="center-buttons margin-top-small">
            <button id="toggle-timer-btn" onClick={() => setTimerVisible(!timerVisible)}>
              {timerVisible ? 'Ukryj licznik' : 'Pokaż licznik'}
            </button>
          </div>
        )}
      </div>

      {timerVisible && autoTimeLeft > 0 && (
        <div id="auto-timer" style={{ display: 'block' }}>
          {autoTimeLeft}
        </div>
      )}
    </div>
  );
}
