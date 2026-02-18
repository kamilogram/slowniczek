import React, { useState } from 'react';
import { generatePackage } from '../services/ai';
import './AIPackageGenerator.css';

export default function AIPackageGenerator({ onAddPackage, onStartQuiz, onToggleGenerator }) {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('angielski');
  const [wordCount, setWordCount] = useState('30');
  const [type, setType] = useState('sentence');
  const [level, setLevel] = useState('A1');
  const [complexity, setComplexity] = useState('simple');
  const [packageName, setPackageName] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const languages = [
    'polski',
    'angielski',
    'niemiecki',
    'francuski',
    'hiszpański',
    'włoski',
    'rosyjski',
    'japoński',
    'chiński',
  ];

  const wordCounts = ['10', '20', '30', '50', '100'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Opisz czego chcesz się nauczyć');
      return;
    }

    if (!packageName.trim()) {
      setError('Wpisz nazwę pakietu');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const generated = await generatePackage({
        description: description.trim(),
        language,
        wordCount: parseInt(wordCount),
        type,
        level,
        complexity,
        packageName: packageName.trim(),
      });

      setPreview(generated);
    } catch (err) {
      const errorMsg = err.message;
      const parts = errorMsg.split('. Spróbuj zmniejszyć ilość słówek/zdań.');
      if (parts.length > 1) {
        setError(
          <>
            Błąd: {parts[0]}.<br />
            <span style={{ fontStyle: 'italic', color: '#ff6b6b', fontWeight: '600' }}>
              Spróbuj zmniejszyć ilość słówek/zdań.
            </span>
          </>
        );
      } else {
        setError(`Błąd: ${errorMsg}`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    if (!preview) return;

    onAddPackage(preview);
    
    // Reset form
    setDescription('');
    setPackageName('');
    setPreview(null);
    setShowGenerator(false);
  };

  const handleStartQuiz = () => {
    if (!preview) return;
    onStartQuiz(preview);
    // Reset form
    setDescription('');
    setPackageName('');
    setPreview(null);
    setShowGenerator(false);
  };

  const handleToggle = () => {
    const newState = !showGenerator;
    setShowGenerator(newState);
    if (onToggleGenerator) {
      onToggleGenerator(newState);
    }
  };

  return (
    <div className="ai-generator">
      <button 
        className="btn-toggle-generator"
        onClick={handleToggle}
      >
        🤖 {showGenerator ? 'Ukryj' : 'Generuj pakiet z AI'}
      </button>

      {showGenerator && (
        <div className="generator-form">
          <h3>Generuj pakiet z AI</h3>

          <div className="form-group">
            <label htmlFor="description">Opisz czego chcesz się nauczyć:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Słówka o zwierzętach, Kolory, Rozmowy w restauracji..."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="package-name">Nazwa pakietu:</label>
            <input
              id="package-name"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="np. Zwierzęta A1"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">Język:</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="word-count">Ilość słówek/zdań:</label>
              <select
                id="word-count"
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                disabled={loading}
              >
                {wordCounts.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Typ:</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              >
                <option value="word">Słówka</option>
                <option value="sentence">Zdania</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="level">Poziom:</label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={loading}
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {type === 'sentence' && (
              <div className="form-group">
                <label htmlFor="complexity">Złożoność zdań:</label>
                <select
                  id="complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  disabled={loading}
                >
                  <option value="simple">Proste</option>
                  <option value="complex">Złożone</option>
                </select>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
          >
            {loading ? '⏳ Generuję...' : '✨ Generuj'}
          </button>

          {preview && (
            <div className="preview-section">
              <h4>Preview:</h4>
              <div className="preview-info">
                <p>
                  <strong>{preview.name}</strong> - {preview.language} ({preview.count} {type === 'word' ? 'słówek' : 'zdań'})
                </p>
              </div>

              <div className="preview-items">
                {preview.words.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="preview-item">
                    <span className="front">{item.hint}</span>
                    <span className="separator">→</span>
                    <span className="back">{item.answer}</span>
                  </div>
                ))}
                {preview.words.length > 5 && (
                  <p className="more-items">... i {preview.words.length - 5} więcej</p>
                )}
              </div>

              <div className="preview-actions">
                <button
                  className="btn-start"
                  onClick={handleStartQuiz}
                >
                  ▶ Zacznij
                </button>
              </div>
              <div className="preview-actions-secondary">
                <button
                  className="btn-add"
                  onClick={handleAddPackage}
                >
                  ✓ Dodaj do pakietów
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setPreview(null)}
                >
                  ✗ Odrzuć
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
