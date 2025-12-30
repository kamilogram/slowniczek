import React, { useState } from 'react';

const getDiff = (oldText, newText) => {
  const oldWords = oldText.split(' ');
  const newWords = newText.split(' ');
  const result = [];
  let i = 0, j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      result.push({ type: 'same', text: oldWords[i] });
      i++; j++;
    } else if (i < oldWords.length && (j >= newWords.length || oldWords[i] !== newWords[j])) {
      result.push({ type: 'removed', text: oldWords[i] });
      i++;
    } else if (j < newWords.length) {
      result.push({ type: 'added', text: newWords[j] });
      j++;
    }
  }
  return result;
};

const DiffText = ({ oldText, newText }) => {
  const diff = getDiff(oldText, newText);
  return (
    <div>
      <div style={{marginBottom: '4px'}}>
        {diff.map((part, i) => (
          part.type === 'removed' ? (
            <span key={i} style={{color: '#900', textDecoration: 'line-through'}}>{part.text} </span>
          ) : part.type === 'same' ? (
            <span key={i} style={{color: '#555'}}>{part.text} </span>
          ) : null
        ))}
      </div>
      <div>
        {diff.map((part, i) => (
          part.type === 'added' ? (
            <span key={i} style={{color: '#090', fontWeight: 'bold'}}>{part.text} </span>
          ) : part.type === 'same' ? (
            <span key={i} style={{color: '#555'}}>{part.text} </span>
          ) : null
        ))}
      </div>
    </div>
  );
};

export default function PackageEditor({ pkg, onSave, onClose }) {
  const [words, setWords] = useState((pkg.words || []).map((w, i) => ({...w, _id: i})));
  const [packageName, setPackageName] = useState(pkg.name || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const originalWords = (pkg.words || []).map((w, i) => ({...w, _id: i}));

  const handleEdit = (index, field, value) => {
    const newWords = [...words];
    newWords[index] = { ...newWords[index], [field]: value };
    setWords(newWords);
  };

  const handleDelete = (index) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const getChanges = () => {
    const modified = words.map(word => {
      const orig = originalWords.find(o => o._id === word._id);
      if (orig && (word.hint !== orig.hint || word.answer !== orig.answer)) {
        return { old: orig, new: word };
      }
      return null;
    }).filter(Boolean);
    
    const deletedIds = new Set(words.map(w => w._id));
    const deleted = originalWords.filter(orig => !deletedIds.has(orig._id));
    
    return { deleted, modified };
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const handleCancelConfirm = () => {
    setWords([...originalWords]);
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    onSave(words.map(({_id, ...w}) => w), packageName);
    onClose();
  };

  const { deleted, modified } = getChanges();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          style={{fontSize: '1.5em', fontWeight: 'bold', marginBottom: '16px', width: '100%', padding: '8px'}}
        />
        <div className="words-list">
          {words.map((word, i) => (
            <div key={i} className="word-edit-item">
              <textarea
                value={word.hint}
                onChange={(e) => handleEdit(i, 'hint', e.target.value)}
                placeholder="Hint"
                rows={1}
              />
              <textarea
                value={word.answer}
                onChange={(e) => handleEdit(i, 'answer', e.target.value)}
                placeholder="Answer"
                rows={1}
              />
              <button onClick={() => handleDelete(i)}>🗑</button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={handleSaveClick}>Zapisz zmiany</button>
          <button onClick={onClose}>Anuluj</button>
        </div>

        {showConfirm && (
          <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Potwierdzenie</h3>
              <p>Czy na pewno chcesz zapisać zmiany w pakiecie "{packageName}"?</p>
              
              {modified.length > 0 && (
                <div>
                  <h4>Zmodyfikowane ({modified.length}):</h4>
                  {modified.map((change, i) => (
                    <div key={i} style={{fontSize: '0.9em', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px'}}>
                      <div style={{marginBottom: '4px', fontWeight: 'bold'}}>Hint:</div>
                      <DiffText oldText={change.old.hint} newText={change.new.hint} />
                      <div style={{marginTop: '8px', marginBottom: '4px', fontWeight: 'bold'}}>Answer:</div>
                      <DiffText oldText={change.old.answer} newText={change.new.answer} />
                    </div>
                  ))}
                </div>
              )}
              
              {deleted.length > 0 && (
                <div>
                  <h4>Usunięte ({deleted.length}):</h4>
                  {deleted.map((w, i) => (
                    <div key={i} style={{fontSize: '0.9em', marginBottom: '4px', color: '#900'}}>
                      {w.hint} - {w.answer}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="confirm-actions">
                <button onClick={handleConfirm}>Potwierdź</button>
                <button onClick={handleCancelConfirm}>Anuluj</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
