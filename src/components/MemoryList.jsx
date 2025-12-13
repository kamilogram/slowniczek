import React from 'react';

export default function MemoryList({ memory, onRemove }) {
  if (memory.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '1em' }}>Brak zapamiętanych słówek.</p>;
  }

  return (
    <div id="memory-list" style={{ marginTop: '1em' }}>
      {memory.map((word, index) => (
        <div key={index} className="memory-item">
          <div className="memory-item-content">
            <b>{word.answer}</b>
            <span>{word.hint}</span>
          </div>
          <button onClick={() => onRemove(index)}>Usuń</button>
        </div>
      ))}
    </div>
  );
}

