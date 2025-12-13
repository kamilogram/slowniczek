import React, { useState, useEffect, useRef } from 'react';

export default function FlashCard({ current, showAnswer, previous, onTextSelected }) {
  const answerRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && showAnswer && answerRef.current && answerRef.current.contains(selection.anchorNode)) {
        setSelectedText(text);
        
        // Get position for button
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const answerRect = answerRef.current.getBoundingClientRect();
        
        setButtonPosition({
          top: rect.bottom - answerRect.top + 10,
          left: rect.left - answerRect.left + (rect.width / 2) - 50
        });
        setShowSaveButton(true);
      } else {
        setShowSaveButton(false);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [showAnswer]);

  const handleSaveSelected = () => {
    if (selectedText && onTextSelected) {
      onTextSelected(selectedText);
      setShowSaveButton(false);
      setSelectedText('');
      window.getSelection().removeAllRanges();
    }
  };

  if (!current) {
    return (
      <div className="card">
        <h2>Gratulacje! Wszystkie słówka odgadnięte.</h2>
      </div>
    );
  }

  return (
    <div className="card">
      {previous && (
        <p id="last-word">
          Poprzednie: <b className="last-word-green">{previous.answer}</b> - <i>{previous.hint}</i>
        </p>
      )}

      <p id="progress"></p> {/* Progress is handled in MainApp usually, but original had it in card */}

      <h2 id="hint">
        {current.hint}
      </h2>

      <div style={{ position: 'relative' }}>
        <p 
          id="answer" 
          ref={answerRef}
          style={{ visibility: showAnswer ? 'visible' : 'hidden' }}
        >
          {current.answer}
        </p>
        {showSaveButton && showAnswer && (
          <button
            onClick={handleSaveSelected}
            style={{
              position: 'absolute',
              top: `${buttonPosition.top}px`,
              left: `${buttonPosition.left}px`,
              zIndex: 1000,
              padding: '0.3em 0.8em',
              fontSize: '0.9em',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(90deg, #ffe0e0 0%, #ffb3b3 100%)',
              color: '#900',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            💾 Zapisz zaznaczone
          </button>
        )}
      </div>
    </div>
  );
}
