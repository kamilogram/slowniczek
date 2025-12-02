import React from 'react';

export default function FlashCard({ current, showAnswer, previous }) {
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

      <h2 id="hint" className={current.source && current.source.startsWith('remote') ? 'english-hint' : ''}>
        {current.hint}
      </h2>

      <p id="answer" style={{ visibility: showAnswer ? 'visible' : 'hidden' }}>
        {current.answer}
      </p>
    </div>
  );
}
