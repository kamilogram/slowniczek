import { useState, useEffect, useCallback, useRef } from 'react';
import { loadFromStorage, saveToStorage } from '../services/storage';
import { speak, cancel as cancelSpeech, getVoices } from '../services/speech';
import { getSets, getSet, saveSet, deleteSet } from '../services/api';

// Import data
import allWordsData from '../data/allWords';
import allWords2Data from '../data/allWords2';
import easiestData from '../data/english/easiest';
import zdaniaData from '../data/zdania';

const localPackagesConfig = [
  { id: 'allWords', name: 'Podstawowe słówka', language: 'Polski', type: 'word', data: allWordsData },
  { id: 'allWords2', name: 'Rozszerzone słówka', language: 'Polski', type: 'word', data: allWords2Data },
  { id: 'easiest', name: 'Angielskie słówka', language: 'Angielski', type: 'word', data: easiestData },
  { id: 'zdania', name: 'Przykładowe zdania', language: 'Angielski', type: 'sentence', data: zdaniaData.pierwsze },
];

export function useGameLogic() {
  // Game State
  const [gameState, setGameState] = useState('start'); // 'start', 'quiz'
  const [combinedWords, setCombinedWords] = useState([]);
  const [pool, setPool] = useState([]);
  const [used, setUsed] = useState([]);
  const [current, setCurrent] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [wasSkipped, setWasSkipped] = useState(false);

  // Auto Mode State
  const [autoMode, setAutoMode] = useState(false);
  const [autoStep, setAutoStep] = useState(0); // 0: hint, 1: answer
  const [autoTimeLeft, setAutoTimeLeft] = useState(0);
  const [timerVisible, setTimerVisible] = useState(true);

  // Settings & Meta
  const [remoteSets, setRemoteSets] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [answerLanguage, setAnswerLanguage] = useState('en-US');

  // Refs for timers to avoid closure staleness
  const autoTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // --- Initialization ---
  useEffect(() => {
    // Load initial state
    const savedUsed = loadFromStorage('slowkaUsed') || [];
    setUsed(savedUsed);

    const savedSelected = loadFromStorage('slowkaSelectedPackages') || [];
    setSelectedPackages(savedSelected);

    const savedCustom = loadFromStorage('slowkaCustomWords');
    if (savedCustom && Array.isArray(savedCustom)) {
      // We don't set input, but we might want to use them if we were in game.
      // For now, we just keep them in storage until start is pressed or we restore session.
    }

    const savedAuto = loadFromStorage('slowkaAutoMode') === 'true';
    // We don't auto-start auto mode on reload for safety/UX, but we could.

    const savedTimerVisible = loadFromStorage('slowkaTimerVisible');
    setTimerVisible(savedTimerVisible !== 'false');

    refreshRemoteSets();
  }, []);

  // --- Remote Sets ---
  const refreshRemoteSets = useCallback(async () => {
    try {
      const cached = loadFromStorage('slowkaRemoteSetsCache');
      if (cached && cached.sets) setRemoteSets(cached.sets);

      const data = await getSets();
      if (data && data.sets) {
        setRemoteSets(data.sets);
        saveToStorage('slowkaRemoteSetsCache', { sets: data.sets, timestamp: Date.now() });
      }
    } catch (e) {
      console.error("Failed to refresh remote sets", e);
    }
  }, []);

  // --- Game Actions ---
  const startGame = useCallback(async (selectedIds, customWordsRaw, remoteSetNames) => {
    let newCombined = [];
    
    // Track which sources are currently selected
    const selectedSources = new Set();
    
    // Add local package sources
    selectedIds.forEach(id => {
      selectedSources.add(`local-${id}`);
    });
    
    // Add remote set sources
    remoteSetNames.forEach(name => {
      selectedSources.add(`remote-${name}`);
    });
    
    // Add custom source if custom words are provided or loaded
    if (customWordsRaw || loadFromStorage('slowkaCustomWords')) {
      selectedSources.add('custom');
    }

    // Local packages
    selectedIds.forEach(id => {
      const pkg = localPackagesConfig.find(p => p.id === id);
      if (pkg) {
        newCombined.push(...pkg.data.map(w => ({ ...w, source: `local-${id}` })));
      }
    });

    // Remote sets
    for (const name of remoteSetNames) {
      try {
        // Check if we have full data in remoteSets, otherwise fetch
        // The list only has metadata usually, so we fetch details
        const set = await getSet(name);
        if (set && set.words) {
          newCombined.push(...set.words.map(w => ({ ...w, source: `remote-${name}` })));
        }
      } catch (e) {
        console.error(`Failed to load remote set ${name}`, e);
      }
    }

    // Custom words
    if (customWordsRaw) {
      try {
        let parsed = [];
        try {
          parsed = JSON.parse(customWordsRaw);
        } catch {
          parsed = customWordsRaw.split('\n')
            .map(line => line.split(/ - |;|\t/))
            .filter(parts => parts.length >= 2)
            .map(parts => ({ hint: parts[0].trim(), answer: parts.slice(1).join(' ').trim() }));
        }
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(w => w.hint && w.answer);
          newCombined.push(...valid.map(w => ({ ...w, source: 'custom' })));
          saveToStorage('slowkaCustomWords', valid);
        }
      } catch (e) {
        console.error("Failed to parse custom words", e);
      }
    } else {
      // Load saved custom words if any
      const saved = loadFromStorage('slowkaCustomWords');
      if (saved) newCombined.push(...saved.map(w => ({ ...w, source: 'custom' })));
    }

    if (newCombined.length === 0) {
      alert("Nie wybrano żadnych słówek!");
      return;
    }

    setCombinedWords(newCombined);

    // Filter out used words - but only from currently selected sources
    const savedUsed = loadFromStorage('slowkaUsed') || [];
    // Only consider used words that come from currently selected sources
    const relevantUsed = savedUsed.filter(u => {
      // If the used word has a source, check if it's in selected sources
      if (u.source) {
        return selectedSources.has(u.source);
      }
      // For backward compatibility: if no source, check if it matches any word in newCombined
      // This handles old data that might not have source field
      return newCombined.some(w => w.answer === u.answer && w.hint === u.hint);
    });
    
    const newPool = newCombined.filter(w => !relevantUsed.some(u => u.answer === w.answer && u.hint === w.hint));

    setPool(newPool);
    // Only keep used words from currently selected sources
    setUsed(relevantUsed);
    setGameState('quiz');

    // Pick first word directly (avoid circular dependency with pickNextWord)
    if (newPool.length > 0) {
      const index = Math.floor(Math.random() * newPool.length);
      const firstWord = newPool[index];
      setCurrent(firstWord);
      setWasSkipped(false);
    } else {
      setCurrent(null);
    }

    // Check if auto mode was enabled before
    const savedAuto = loadFromStorage('slowkaAutoMode') === 'true';
    if (savedAuto && !autoMode) {
      // Enable auto mode after ensuring speech synthesis is ready
      // First ensure speech synthesis is initialized
      getVoices()
        .then(() => {
          // Then enable auto mode after a short delay to ensure current word is set
          setTimeout(() => {
            setAutoMode(true);
            setAutoStep(0);
          }, 200);
        })
        .catch(() => {
          // Even if voices fail to load, try to enable auto mode anyway
          setTimeout(() => {
            setAutoMode(true);
            setAutoStep(0);
          }, 200);
        });
    }

  }, [autoMode]);

  const pickNextWord = useCallback((currentPool, currentPrevious) => {
    if (currentPool.length === 0) {
      setCurrent(null);
      return;
    }

    let index;
    // Try to pick a different word than previous
    let attempts = 0;
    do {
      index = Math.floor(Math.random() * currentPool.length);
      attempts++;
    } while (
      currentPrevious &&
      currentPool.length > 1 &&
      currentPool[index].hint === currentPrevious.hint &&
      currentPool[index].answer === currentPrevious.answer &&
      attempts < 10
    );

    const nextWord = currentPool[index];
    setCurrent(nextWord);
    setWasSkipped(false);
  }, []);

  const showAnswer = useCallback(() => {
    setWasSkipped(true);
  }, []);

  const nextWord = useCallback(() => {
    if (!current) return;

    let newUsed = used;
    let newPool = pool;

    if (!wasSkipped) {
      newUsed = [...used, current];
      setUsed(newUsed);
      saveToStorage('slowkaUsed', newUsed);

      newPool = pool.filter(w => w !== current);
      setPool(newPool);
    }

    setPrevious(current);
    pickNextWord(newPool, current);
  }, [current, wasSkipped, used, pool, pickNextWord]);

  const restart = useCallback(() => {
    if (confirm('Czy na pewno chcesz zrestartować?')) {
      // Get sources from currently selected packages
      const currentSources = new Set(combinedWords.map(w => w.source).filter(Boolean));
      
      // Remove only used words from currently selected sources
      const savedUsed = loadFromStorage('slowkaUsed') || [];
      const remainingUsed = savedUsed.filter(u => {
        // Keep words that don't have a source (backward compatibility)
        if (!u.source) return true;
        // Remove words from currently selected sources
        return !currentSources.has(u.source);
      });
      
      saveToStorage('slowkaUsed', remainingUsed);
      setUsed([]);
      setPool([...combinedWords]);
      setPrevious(null);
      setWasSkipped(false);
      pickNextWord([...combinedWords], null);
    }
  }, [combinedWords, pickNextWord]);

  const undo = useCallback(() => {
    if (!previous) return;

    // Check if previous is in used
    const idx = used.findIndex(w => w.answer === previous.answer && w.hint === previous.hint);
    if (idx !== -1) {
      const newUsed = [...used];
      newUsed.splice(idx, 1);
      setUsed(newUsed);
      saveToStorage('slowkaUsed', newUsed);

      // Add back to pool if not present
      if (!pool.some(w => w.answer === previous.answer && w.hint === previous.hint)) {
        setPool([...pool, previous]);
      }
    }

    setCurrent(previous);
    // Previous becomes null or we need a history stack for multiple undos (app.js only supported 1 level)
    setPrevious(null);
    setWasSkipped(false);
  }, [previous, used, pool]);

  // --- Auto Mode Logic ---
  const stopAutoMode = useCallback(() => {
    setAutoMode(false);
    saveToStorage('slowkaAutoMode', 'false');
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    cancelSpeech();
    setAutoTimeLeft(0);
  }, []);

  const startAutoMode = useCallback(() => {
    setAutoMode(true);
    saveToStorage('slowkaAutoMode', 'true');
    setAutoStep(0);
    // Logic will be triggered by effect
  }, []);

  const toggleAutoMode = useCallback(() => {
    if (autoMode) stopAutoMode();
    else startAutoMode();
  }, [autoMode, stopAutoMode, startAutoMode]);

  // Auto Mode Effect
  useEffect(() => {
    if (!autoMode || !current) {
      if (autoMode && !current && pool.length === 0) {
        stopAutoMode();
      }
      return;
    }

    const runAutoStep = async () => {
      // Ensure speech synthesis is fully initialized before speaking
      try {
        await getVoices();
      } catch (e) {
        console.warn('Speech synthesis voices not ready, continuing anyway', e);
      }

      const multiplier = parseFloat(loadFromStorage('slowkaTimeMultiplier') || 1.0);
      const speechRate = parseFloat(loadFromStorage('slowkaSpeechRate') || 1.0);

      const hintLength = current.hint ? current.hint.length : 0;
      const answerLength = current.answer ? current.answer.length : 0;

      const baseHintDelay = Math.max(3, 2 + (hintLength + answerLength) * 0.08);
      const baseAnswerDelay = Math.max(2, 1 + answerLength * 0.08);

      const hintDelay = Math.round(baseHintDelay * multiplier) * 1000;
      const answerDelay = Math.round(baseAnswerDelay * multiplier) * 1000;

      if (autoStep === 0) {
        // Speak Hint
        await speak(current.hint, 'pl-PL', speechRate); // Assuming hint is PL usually, or detect

        // Start Timer
        startCountdown(hintDelay);
        autoTimerRef.current = setTimeout(() => {
          showAnswer();
          setAutoStep(1);
        }, hintDelay);
      } else {
        // Speak Answer
        await speak(current.answer, answerLanguage, speechRate);

        // Start Timer
        startCountdown(answerDelay);
        autoTimerRef.current = setTimeout(() => {
          nextWord();
          setAutoStep(0);
        }, answerDelay);
      }
    };

    runAutoStep();

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      cancelSpeech();
    };
  }, [autoMode, current, autoStep, answerLanguage, nextWord, showAnswer, stopAutoMode, pool.length]);

  const startCountdown = (duration) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    let left = Math.ceil(duration / 1000);
    setAutoTimeLeft(left);

    countdownIntervalRef.current = setInterval(() => {
      left--;
      setAutoTimeLeft(left);
      if (left <= 0) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);
  };

  // --- Helpers ---
  const clearUsedHistory = useCallback(() => {
    if (confirm('Czy na pewno chcesz wyczyścić historię?')) {
      saveToStorage('slowkaUsed', []);
      setUsed([]);
      // If in game, reset pool
      if (gameState === 'quiz') {
        setPool([...combinedWords]);
        pickNextWord([...combinedWords], null);
      }
    }
  }, [gameState, combinedWords, pickNextWord]);

  // --- Memory Functions ---
  const saveCurrentWordToMemory = useCallback(() => {
    if (!current) {
      alert('Brak aktualnego słowa!');
      return false;
    }
    const mem = loadFromStorage('slowkaMemory') || [];
    if (!mem.some(w => w.answer === current.answer && w.hint === current.hint)) {
      mem.push(current);
      saveToStorage('slowkaMemory', mem);
      return true;
    }
    alert('To słowo już jest w pamięci.');
    return false;
  }, [current]);

  const savePreviousWordToMemory = useCallback(() => {
    if (!previous) {
      alert('Brak poprzedniego słowa!');
      return false;
    }
    const mem = loadFromStorage('slowkaMemory') || [];
    if (!mem.some(w => w.answer === previous.answer && w.hint === previous.hint)) {
      mem.push(previous);
      saveToStorage('slowkaMemory', mem);
      return true;
    }
    alert('To słowo już jest w pamięci.');
    return false;
  }, [previous]);

  const getMemory = useCallback(() => {
    return loadFromStorage('slowkaMemory') || [];
  }, []);

  const removeFromMemory = useCallback((index) => {
    const mem = loadFromStorage('slowkaMemory') || [];
    const updatedMemory = mem.filter((_, i) => i !== index);
    saveToStorage('slowkaMemory', updatedMemory);
    return updatedMemory;
  }, []);

  // --- Selected Text Memory Functions ---
  const saveSelectedTextToMemory = useCallback((selectedText) => {
    if (!selectedText || !selectedText.trim()) {
      alert('Brak zaznaczonego tekstu!');
      return false;
    }
    const mem = loadFromStorage('slowkaSelectedTexts') || [];
    if (!mem.includes(selectedText.trim())) {
      mem.push(selectedText.trim());
      saveToStorage('slowkaSelectedTexts', mem);
      return true;
    }
    alert('Ten tekst już jest w pamięci.');
    return false;
  }, []);

  const getSelectedTexts = useCallback(() => {
    return loadFromStorage('slowkaSelectedTexts') || [];
  }, []);

  const removeSelectedText = useCallback((index) => {
    const texts = loadFromStorage('slowkaSelectedTexts') || [];
    const updatedTexts = texts.filter((_, i) => i !== index);
    saveToStorage('slowkaSelectedTexts', updatedTexts);
    return updatedTexts;
  }, []);

  return {
    gameState,
    setGameState,
    localPackagesConfig,
    remoteSets,
    refreshRemoteSets,
    startGame,

    current,
    previous,
    wasSkipped,
    usedCount: used.length,
    totalCount: combinedWords.length,

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

    // Memory functions
    saveCurrentWordToMemory,
    savePreviousWordToMemory,
    getMemory,
    removeFromMemory,

    // Selected text memory functions
    saveSelectedTextToMemory,
    getSelectedTexts,
    removeSelectedText,

    // Expose for StartScreen
    selectedPackages,
    setSelectedPackages,
    customWordsInput,
    setCustomWordsInput
  };
}
