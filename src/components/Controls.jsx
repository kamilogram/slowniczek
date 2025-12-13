import React from 'react';

export default function Controls({
  onSkip,
  onNext,
  onRestart,
  onUndo,
  showAnswer,
  autoMode,
  onToggleAutoMode,
  onToggleDarkMode,
  onChangePackages,
  onClearUsed,
  hasPrevious,
  gameFinished,
  onSaveCurrent,
  onSavePrevious
}) {
  if (gameFinished) {
    return (
      <div className="buttons">
        <button id="restart-btn" onClick={onRestart}>Jeszcze raz</button>
        <div className="center-buttons margin-top-small">
          <button className="change-packages-btn" onClick={onChangePackages}>📦 Zmień pakiety</button>
        </div>
      </div>
    );
  }

  if (autoMode) {
    return (
      <>
        <div className="center-buttons gap">
          <button id="auto-mode-btn" className="active" onClick={onToggleAutoMode}>Wyłącz auto</button>
          <button id="toggle-dark-mode-btn" onClick={onToggleDarkMode}>Tryb nocny</button>
        </div>
        <div className="center-buttons margin-top-small">
          <button className="change-packages-btn" onClick={onChangePackages}>📦 Zmień pakiety</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="buttons">
        <button id="skip-word-btn" onClick={onSkip}>Pokaż</button>
        <button id="next-word-btn" onClick={onNext}>{showAnswer ? 'Dalej' : 'Wiem'}</button>
      </div>

      <div className="center-buttons">
        <button id="undo-known-btn" onClick={onUndo} disabled={!hasPrevious}>Jednak nie wiedziałem</button>
      </div>

      <div className="center-buttons gap">
        <button id="auto-mode-btn" onClick={onToggleAutoMode}>Auto tryb</button>
        <button id="toggle-dark-mode-btn" onClick={onToggleDarkMode}>Tryb nocny</button>
      </div>

      <div className="center-buttons margin-top-small">
        <button className="change-packages-btn" onClick={onChangePackages}>📦 Zmień pakiety</button>
      </div>

      <div className="center-buttons margin-top-small">
        <button id="clear-used-btn" onClick={onClearUsed}>Wyczyść odgadnięte słówka</button>
      </div>
    </>
  );
}

export function MemoryButtons({ onSaveCurrent, onSavePrevious, onShowMemory, onShowSelectedTexts, showMemory }) {
  return (
    <div className="memory-buttons" style={{ display: showMemory ? 'block' : 'none' }}>
      <button id="save-word-btn" onClick={onSavePrevious}>Dodaj poprzednie</button>
      <button id="save-current-btn" onClick={onSaveCurrent}>Dodaj aktualne</button>
      <button id="show-memory-btn" onClick={onShowMemory}>Pokaż zapamiętane</button>
      <button id="show-selected-texts-btn" onClick={onShowSelectedTexts}>Pokaż zaznaczone</button>
    </div>
  );
}
