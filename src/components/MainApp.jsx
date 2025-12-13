import React, { useEffect, useState } from 'react';
import FlashCard from './FlashCard';
import Controls, { MemoryButtons } from './Controls';
import AutoModeSettings from './AutoModeSettings';
import MemoryList from './MemoryList';

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
    clearUsedHistory,
    saveCurrentWordToMemory,
    savePreviousWordToMemory,
    getMemory,
    removeFromMemory,
    saveSelectedTextToMemory,
    getSelectedTexts,
    removeSelectedText
  } = gameLogic;

  const [showMemoryButtons, setShowMemoryButtons] = useState(false);
  const [showMemoryList, setShowMemoryList] = useState(false);
  const [memory, setMemory] = useState([]);
  const [showSelectedTexts, setShowSelectedTexts] = useState(false);
  const [selectedTexts, setSelectedTexts] = useState([]);

  const handleShowMemory = () => {
    const mem = getMemory();
    setMemory(mem);
    setShowMemoryList(!showMemoryList);
  };

  const handleSaveCurrent = () => {
    if (saveCurrentWordToMemory()) {
      const mem = getMemory();
      setMemory(mem);
    }
  };

  const handleSavePrevious = () => {
    if (savePreviousWordToMemory()) {
      const mem = getMemory();
      setMemory(mem);
    }
  };

  const handleRemoveFromMemory = (index) => {
    const updatedMemory = removeFromMemory(index);
    setMemory(updatedMemory);
  };

  const handleTextSelected = (text) => {
    if (saveSelectedTextToMemory(text)) {
      const texts = getSelectedTexts();
      setSelectedTexts(texts);
    }
  };

  const handleShowSelectedTexts = () => {
    const texts = getSelectedTexts();
    setSelectedTexts(texts);
    setShowSelectedTexts(!showSelectedTexts);
  };

  const handleRemoveSelectedText = (index) => {
    const updatedTexts = removeSelectedText(index);
    setSelectedTexts(updatedTexts);
  };

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
          onTextSelected={handleTextSelected}
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
          onSaveCurrent={handleSaveCurrent}
          onSavePrevious={handleSavePrevious}
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

        {!autoMode && current && (
          <>
            <div className="center-buttons">
              <button id="other-options-btn" onClick={() => setShowMemoryButtons(!showMemoryButtons)}>
                Inne opcje
              </button>
            </div>

            <MemoryButtons
              onSaveCurrent={handleSaveCurrent}
              onSavePrevious={handleSavePrevious}
              onShowMemory={handleShowMemory}
              onShowSelectedTexts={handleShowSelectedTexts}
              showMemory={showMemoryButtons}
            />

            {showMemoryList && (
              <MemoryList memory={memory} onRemove={handleRemoveFromMemory} />
            )}

            {showSelectedTexts && (
              <div className="selected-texts-list" style={{ marginTop: '1em', padding: '1em', background: '#fff3f3', borderRadius: '12px', border: '1px solid #fabbbb' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5em', fontSize: '1.1em' }}>Zapisane zaznaczenia:</h3>
                {selectedTexts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>Brak zapisanych zaznaczeń.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', marginBottom: '0.5em' }}>
                    {selectedTexts.map((text, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          padding: '0.3em 0.6em',
                          background: '#ffe0e0',
                          borderRadius: '8px',
                          fontSize: '0.9em',
                          position: 'relative',
                          paddingRight: '2em'
                        }}
                      >
                        {text}
                        <button
                          onClick={() => handleRemoveSelectedText(index)}
                          style={{
                            position: 'absolute',
                            right: '0.3em',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#900',
                            cursor: 'pointer',
                            fontSize: '0.8em',
                            padding: '0.2em 0.4em'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em', marginBottom: 0 }}>
                  {selectedTexts.length > 0 && selectedTexts.join(', ')}
                </p>
              </div>
            )}
          </>
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
