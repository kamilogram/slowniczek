import React, { useState, useEffect, useRef, useMemo } from 'react';
import { saveSet, deleteSet, getSet } from '../services/api';
import { saveToStorage } from '../services/storage';

// Mapowanie kodów języków na pełne nazwy
const LANGUAGE_MAP = {
  'en': 'Angielski',
  'pl': 'Polski',
  'es': 'Hiszpański',
  'it': 'Włoski',
  'fr': 'Francuski'
};

// Funkcja normalizująca nazwę języka
const normalizeLanguage = (lang) => {
  if (!lang) return 'Nieokreślony';
  // Jeśli to dwuliterowy kod, zmapuj na pełną nazwę
  if (lang.length === 2 && LANGUAGE_MAP[lang.toLowerCase()]) {
    return LANGUAGE_MAP[lang.toLowerCase()];
  }
  // Jeśli to już pełna nazwa, zwróć ją
  return lang;
};

export default function StartScreen({
  localPackagesConfig,
  remoteSets,
  refreshRemoteSets,
  onStart,
  selectedPackages,
  setSelectedPackages,
  customWordsInput,
  setCustomWordsInput
}) {
  // Group Packages - normalizuj języki z backendu
  const allPackages = useMemo(() => [
    ...localPackagesConfig.map(p => ({ ...p, isLocal: true })),
    ...remoteSets.map(p => ({
      ...p,
      isLocal: false,
      language: normalizeLanguage(p.language) // Normalizuj język
    }))
  ], [localPackagesConfig, remoteSets]);

  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [remoteSearch, setRemoteSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState({});
  const [remoteCounts, setRemoteCounts] = useState({});

  // Remote Set Management State
  const [newSetName, setNewSetName] = useState('');
  const [newSetLang, setNewSetLang] = useState('');
  const [newSetType, setNewSetType] = useState('');

  // Toggle Category
  const toggleCategory = (lang) => {
    setExpandedCategories(prev => ({ ...prev, [lang]: !prev[lang] }));
  };

  // Toggle Type
  const toggleType = (lang, type) => {
    const key = `${lang}-${type}`;
    setExpandedTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-expand categories and types with selected packages
  useEffect(() => {
    if (selectedPackages.length > 0) {
      const newExpandedCategories = {};
      const newExpandedTypes = {};

      selectedPackages.forEach(pkgId => {
        const pkg = allPackages.find(p => (p.isLocal ? p.id : `remote-${p.name}`) === pkgId);
        if (pkg) {
          const lang = pkg.language || 'Nieokreślony';
          const type = pkg.type || 'Nieokreślony typ';
          newExpandedCategories[lang] = true;
          newExpandedTypes[`${lang}-${type}`] = true;
        }
      });

      setExpandedCategories(newExpandedCategories);
      setExpandedTypes(newExpandedTypes);
    }
  }, []); // Run only once on mount

  // Fetch counts for remote packages with count=0
  useEffect(() => {
    // Removed - count is now always provided by backend
  }, [remoteSets]);

  // Filter Remote
  const filteredPackages = allPackages.filter(p => {
    if (p.isLocal) return true;
    if (!remoteSearch) return true;
    return p.name.toLowerCase().includes(remoteSearch.toLowerCase());
  });

  // Check if all packages in a type are selected
  const areAllPackagesInTypeSelected = (lang, type) => {
    const packagesInType = filteredPackages.filter(pkg => {
      const pkgLang = pkg.language || 'Nieokreślony';
      const pkgType = pkg.type || 'Nieokreślony typ';
      return pkgLang === lang && pkgType === type;
    });
    if (packagesInType.length === 0) return false;
    return packagesInType.every(pkg => {
      const id = pkg.isLocal ? pkg.id : `remote-${pkg.name}`;
      return selectedPackages.includes(id);
    });
  };

  // Check if some (but not all) packages in a type are selected
  const areSomePackagesInTypeSelected = (lang, type) => {
    const packagesInType = filteredPackages.filter(pkg => {
      const pkgLang = pkg.language || 'Nieokreślony';
      const pkgType = pkg.type || 'Nieokreślony typ';
      return pkgLang === lang && pkgType === type;
    });
    if (packagesInType.length === 0) return false;
    const selectedCount = packagesInType.filter(pkg => {
      const id = pkg.isLocal ? pkg.id : `remote-${pkg.name}`;
      return selectedPackages.includes(id);
    }).length;
    return selectedCount > 0 && selectedCount < packagesInType.length;
  };

  // Update indeterminate state for type checkboxes
  useEffect(() => {
    // Update all type checkboxes after render
    const checkboxes = document.querySelectorAll('input.type-checkbox');
    checkboxes.forEach(checkbox => {
      const lang = checkbox.getAttribute('data-lang');
      const type = checkbox.getAttribute('data-type');
      if (lang && type) {
        checkbox.indeterminate = areSomePackagesInTypeSelected(lang, type);
      }
    });
  }, [selectedPackages, filteredPackages]);

  // Handle Type Checkbox - toggle all packages in type
  const handleTypeCheckboxChange = (lang, type, e) => {
    e.stopPropagation(); // Prevent type toggle
    const packagesInType = filteredPackages.filter(pkg => {
      const pkgLang = pkg.language || 'Nieokreślony';
      const pkgType = pkg.type || 'Nieokreślony typ';
      return pkgLang === lang && pkgType === type;
    });
    const allSelected = areAllPackagesInTypeSelected(lang, type);

    setSelectedPackages(prev => {
      let newSelected;
      if (allSelected) {
        // Deselect all packages in this type
        const packageIds = packagesInType.map(pkg => pkg.isLocal ? pkg.id : `remote-${pkg.name}`);
        newSelected = prev.filter(id => !packageIds.includes(id));
      } else {
        // Select all packages in this type
        // First, remove packages from other languages (enforce single language)
        const keptPackages = prev.filter(prevId => {
          const pkg = allPackages.find(p => (p.isLocal ? p.id : `remote-${p.name}`) === prevId);
          if (!pkg) return false;
          return pkg.language === lang;
        });
        const packageIds = packagesInType.map(pkg => pkg.isLocal ? pkg.id : `remote-${pkg.name}`);
        newSelected = [...keptPackages, ...packageIds.filter(id => !keptPackages.includes(id))];
      }

      // Save to localStorage
      saveToStorage('slowkaSelectedPackages', newSelected);
      return newSelected;
    });
  };

  // Handle Checkbox
  const handleCheckboxChange = (id, isLocal, lang, type) => {
    setSelectedPackages(prev => {
      let newSelected;
      if (prev.includes(id)) {
        newSelected = prev.filter(p => p !== id);
      } else {
        // Enforce single language: remove packages from other languages
        const keptPackages = prev.filter(prevId => {
          const pkg = allPackages.find(p => (p.isLocal ? p.id : `remote-${p.name}`) === prevId);
          if (!pkg) return false; // Remove if not found (stale)
          return pkg.language === lang;
        });
        newSelected = [...keptPackages, id];
      }

      // Save to localStorage
      saveToStorage('slowkaSelectedPackages', newSelected);
      return newSelected;
    });
  };

  const grouped = filteredPackages.reduce((acc, pkg) => {
    const lang = pkg.language || 'Nieokreślony';
    const type = pkg.type || 'Nieokreślony typ';
    if (!acc[lang]) acc[lang] = {};
    if (!acc[lang][type]) acc[lang][type] = [];
    acc[lang][type].push(pkg);
    return acc;
  }, {});

  const handleStart = async () => {
    // Separate local IDs and remote names
    const localIds = selectedPackages.filter(id => localPackagesConfig.some(p => p.id === id));
    const remoteNames = selectedPackages.filter(id => !localPackagesConfig.some(p => p.id === id))
      .map(id => id.replace('remote-', '')); // Assuming remote IDs are prefixed

    setIsLoading(true);
    try {
      await onStart(localIds, customWordsInput, remoteNames);
    } catch (error) {
      console.error('Error starting game:', error);
      setIsLoading(false);
    }
    // Note: We don't set isLoading to false on success because the component will unmount
    // when gameState changes to 'quiz'
  };

  const handleSaveRemote = async () => {
    if (!newSetName || !newSetLang || !newSetType) {
      alert('Wypełnij wszystkie pola (nazwa, język, typ).');
      return;
    }

    // Parse custom words
    let words = [];
    try {
      words = JSON.parse(customWordsInput);
    } catch {
      words = customWordsInput.split('\n')
        .map(line => line.split(/ - |;|\t/))
        .filter(parts => parts.length >= 2)
        .map(parts => ({ hint: parts[0].trim(), answer: parts.slice(1).join(' ').trim() }));
    }

    if (!words || words.length === 0) {
      alert('Brak poprawnych słówek w polu "Własne słówka".');
      return;
    }

    try {
      await saveSet(newSetName, words, newSetLang, newSetType);
      alert('Zapisano zestaw!');
      setNewSetName('');
      setNewSetLang('');
      setNewSetType('');
      refreshRemoteSets();
    } catch (e) {
      alert('Błąd zapisu: ' + e.message);
    }
  };

  const handleDeleteRemote = async () => {
    if (!newSetName) return alert('Wpisz nazwę zestawu do usunięcia.');
    if (!confirm(`Usunąć zestaw "${newSetName}"?`)) return;
    try {
      await deleteSet(newSetName);
      alert('Usunięto.');
      setNewSetName('');
      refreshRemoteSets();
    } catch (e) {
      alert('Błąd usuwania: ' + e.message);
    }
  };

  return (
    <div className="start-screen">
      <div className="version-badge">v2025-01-20</div>
      <div className="start-card">
        <h1>🎯 Słowappka</h1>
        <p className="start-description">Wybierz pakiety słówek, które chcesz ćwiczyć lub wklej własne:</p>

        <div className="package-categories">
          {Object.keys(grouped).sort().map(lang => (
            <div key={lang} className="category">
              <div className="category-header">
                <button className="category-toggle" onClick={() => toggleCategory(lang)}>
                  <span className="toggle-icon">{expandedCategories[lang] ? '▼' : '▶'}</span>
                  <span className="category-title">{lang}</span>
                </button>
              </div>
              {expandedCategories[lang] && (
                <div className="category-content">
                  {Object.keys(grouped[lang]).sort().map(type => (
                    <div key={type} className="type-section">
                      <div className="type-header">
                        <button className="type-toggle" onClick={() => toggleType(lang, type)}>
                          <span className="toggle-icon">{expandedTypes[`${lang}-${type}`] ? '▼' : '▶'}</span>
                          <span className="type-title">{type === 'word' ? 'Słówka' : type === 'sentence' ? 'Zdania' : type}</span>
                        </button>
                        <input
                          type="checkbox"
                          className="type-checkbox"
                          data-lang={lang}
                          data-type={type}
                          checked={areAllPackagesInTypeSelected(lang, type)}
                          onChange={(e) => handleTypeCheckboxChange(lang, type, e)}
                          onClick={(e) => e.stopPropagation()}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = areSomePackagesInTypeSelected(lang, type);
                            }
                          }}
                        />
                      </div>
                      {expandedTypes[`${lang}-${type}`] && (
                        <div className="type-content">
                          <select 
                            value={sortBy[`${lang}-${type}`] || 'unsorted'} 
                            onChange={(e) => setSortBy(prev => ({...prev, [`${lang}-${type}`]: e.target.value}))}
                            className="sort-select"
                          >
                            <option value="unsorted">Nieposortowane</option>
                            <option value="alpha-asc">Alfabetycznie A-Z</option>
                            <option value="alpha-desc">Alfabetycznie Z-A</option>
                            <option value="date-asc">Data utworzenia (najstarsze)</option>
                            <option value="date-desc">Data utworzenia (najnowsze)</option>
                          </select>
                          <div className="package-list">
                            {[...grouped[lang][type]].sort((a, b) => {
                              const sort = sortBy[`${lang}-${type}`] || 'unsorted';
                              if (sort === 'unsorted') return 0;
                              if (sort === 'alpha-asc') return a.name.localeCompare(b.name);
                              if (sort === 'alpha-desc') return b.name.localeCompare(a.name);
                              if (sort === 'date-asc') {
                                if (!a.created_at && !b.created_at) return 0;
                                if (!a.created_at) return 1;
                                if (!b.created_at) return -1;
                                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                              }
                              if (sort === 'date-desc') {
                                if (!a.created_at && !b.created_at) return 0;
                                if (!a.created_at) return 1;
                                if (!b.created_at) return -1;
                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                              }
                              return 0;
                            }).map(pkg => {
                              const id = pkg.isLocal ? pkg.id : `remote-${pkg.name}`;
                              return (
                                <label key={id} className="package-item">
                                  <input
                                    type="checkbox"
                                    checked={selectedPackages.includes(id)}
                                    onChange={() => handleCheckboxChange(id, pkg.isLocal, lang, type)}
                                  />
                                  <span className="package-name">{pkg.name}</span>
                                  <span className="package-count">{pkg.isLocal ? pkg.data.length : (pkg.count || 0)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="custom-words-container" style={{ marginBottom: '16px' }}>
          <label htmlFor="custom-words-input"><b>Wklej własne słówka (array obiektów hint/answer):</b></label>
          <textarea
            id="custom-words-input"
            rows="4"
            style={{ width: '100%', marginTop: '4px' }}
            placeholder='[{"hint":"pies","answer":"dog"},...]'
            value={customWordsInput}
            onChange={(e) => setCustomWordsInput(e.target.value)}
          ></textarea>
        </div>

        <div className="remote-sets" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Nazwa zestawu"
              style={{ flex: '1 1 240px', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
            />
            <div className="remote-set-meta">
              <select value={newSetLang} onChange={(e) => setNewSetLang(e.target.value)}>
                <option value="">Język...</option>
                <option value="Polski">Polski</option>
                <option value="Angielski">Angielski</option>
                <option value="Hiszpański">Hiszpański</option>
                <option value="Włoski">Włoski</option>
                <option value="Francuski">Francuski</option>
              </select>
              <select value={newSetType} onChange={(e) => setNewSetType(e.target.value)}>
                <option value="">Typ...</option>
                <option value="word">Słówka</option>
                <option value="sentence">Zdania</option>
              </select>
            </div>
            <button onClick={handleSaveRemote}>💾 Zapisz do API</button>
            <button onClick={handleDeleteRemote}>🗑 Usuń z API</button>
            <button onClick={refreshRemoteSets}>🔄 Odśwież</button>
          </div>
        </div>

        <div className="remote-sets-section">
          <div className="remote-sets-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="🔍 Wyszukaj zestawy z API..."
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
              value={remoteSearch}
              onChange={(e) => setRemoteSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="start-actions sticky-start-actions">
          <button
            className="start-btn"
            disabled={(selectedPackages.length === 0 && !customWordsInput) || isLoading}
            onClick={handleStart}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span style={{ marginLeft: '8px' }}>Ładowanie...</span>
              </>
            ) : (
              'Rozpocznij'
            )}
          </button>
          <p className="selected-info">
            {selectedPackages.length > 0 || customWordsInput ? `Wybrano ${selectedPackages.length + (customWordsInput ? 1 : 0)} pakiet(ów).` : 'Wybierz co najmniej jeden pakiet'}
          </p>
        </div>
      </div>
    </div>
  );
}
