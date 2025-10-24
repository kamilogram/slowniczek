import { initUI, renderAllPackages, updateStartButton, showPackageSelectionScreen, showMainAppScreen, updateProgressUI, displayWord, renderMemoryList, clearUsedWordsUI } from './ui.js';
import { getSets, getSet, saveSet, deleteSet } from './api.js';
import { loadFromStorage, saveToStorage } from './storage.js';
import { speak, cancel as cancelSpeech } from './speech.js';

// --- Zmienne globalne stanu aplikacji ---
let localPackages = {};
let remoteSets = [];
let combinedWords = [];
let pool = [];
let used = [];
let current = null;
let previous = null;
let wasSkipped = false;
let autoMode = false;
let autoTimer = null;
let autoStep = 0;
let autoTimeLeft = 0;

// Import statycznych słówek
import allWordsData from './allWords.js';
import allWords2Data from './allWords2.js';
import easiestData from './english/easiest.js';
import zdaniaData from './zdania.js';


const localPackagesConfig = [
  { id: 'allWords', name: 'Podstawowe słówka', language: 'Polski', type: 'word', data: allWordsData },
  { id: 'allWords2', name: 'Rozszerzone słówka', language: 'Polski', type: 'word', data: allWords2Data },
  { id: 'easiest', name: 'Angielskie słówka', language: 'Angielski', type: 'word', data: easiestData },
  { id: 'zdania', name: 'Przykładowe zdania', language: 'Angielski', type: 'sentence', data: zdaniaData.pierwsze },
];

// --- Główne funkcje aplikacji ---
export function initializeApp() {
  localPackages = localPackagesConfig.reduce((acc, pkg) => {
    acc[pkg.id] = pkg;
    return acc;
  }, {});

  // Opóźnij renderowanie do momentu gdy DOM jest gotowy
  setTimeout(() => {
    initUI({
      onStart: startApplication,
      onChangePackages: showPackageSelection,
      onSkip: skipWord,
      onNext: nextWord,
      onRestart: restart,
      onUndo: undoKnownWord,
      onAutoModeToggle: toggleAutoMode,
      onSaveCurrent: saveCurrentWordToMemory,
      onSavePrevious: savePreviousWordToMemory,
      onClearUsed: clearUsed,
      onRefreshRemote: refreshRemoteSetsList,
      onSaveRemote: saveCustomSetToApi,
      onDeleteRemote: deleteRemoteSetFromApi,
      onSelectionChange: () => updateStartButton(localPackages, remoteSets),
      onFilterRemote: filterRemoteSets,
    });

    // Dodatkowe opóźnienie, aby initUI zdążyło zainicjalizować elementy
    setTimeout(async () => {
      // Sprawdź czy element istnieje przed renderowaniem
      const container = document.getElementById('package-categories-container');
      if (container) {
        // Najpierw załaduj zestawy z cache/API
        await refreshRemoteSetsList().catch(err => {
          console.error("An unhandled error occurred during remote set refresh:", err);
        });
        
        // Potem renderuj z aktualnymi zestawami
        renderAllPackages(localPackagesConfig, remoteSets);
        loadSavedPackages();
        updateStartButton(localPackages, remoteSets);
      } else {
        console.error('Package categories container not found, retrying...');
        // Spróbuj ponownie za 100ms
        setTimeout(async () => {
          await refreshRemoteSetsList().catch(err => {
            console.error("An unhandled error occurred during remote set refresh:", err);
          });
          
          renderAllPackages(localPackagesConfig, remoteSets);
          loadSavedPackages();
          updateStartButton(localPackages, remoteSets);
        }, 100);
      }
    }, 10);
  }, 0);
  
  if (loadFromStorage('slowkaDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const darkBtn = document.getElementById('toggle-dark-mode-btn');
    if (darkBtn) darkBtn.textContent = 'Tryb dzienny';
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered.', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
}

function loadSavedPackages() {
  const saved = loadFromStorage('slowkaSelectedPackages');
  if (saved && Array.isArray(saved)) {
    saved.forEach(pkgId => {
      const checkbox = document.getElementById(pkgId);
      if (checkbox) checkbox.checked = true;
    });
  }
}

async function startApplication() {
  const startBtn = document.getElementById('start-btn');
  const originalText = startBtn.textContent;
  startBtn.textContent = 'Ładowanie...';
  startBtn.disabled = true;

  try {
    await combineSelectedPackages();
    showMainAppScreen();
    initializeGame();

    if (loadFromStorage('slowkaAutoMode') === 'true') {
      startAutoMode();
      document.getElementById('lang-select-container').style.display = 'flex';
    }
  } catch (e) {
    console.error('Błąd ładowania pakietów:', e);
    alert('Błąd ładowania pakietów. Sprawdź połączenie z internetem.');
    startBtn.textContent = originalText;
    startBtn.disabled = false;
  }
}

function showPackageSelection() {
    if (autoMode) {
        stopAutoMode();
    }
    showPackageSelectionScreen();
    renderAllPackages(localPackagesConfig, remoteSets);
    updateStartButton(localPackages, remoteSets);
    refreshRemoteSetsList();
}

function initializeGame() {
  used = loadFromStorage('slowkaUsed') || [];
  pool = combinedWords.filter(w => !used.some(u => u.answer === w.answer && u.hint === w.hint));
  showWord();
}

async function combineSelectedPackages() {
  combinedWords = [];
  const selectedPackagesIds = Array.from(document.querySelectorAll('#start-screen input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.id);

  saveToStorage('slowkaSelectedPackages', selectedPackagesIds);

  selectedPackagesIds.forEach(pkgId => {
    if (localPackages[pkgId]) {
      combinedWords.push(...localPackages[pkgId].data);
    }
  });

  const remoteCheckboxes = document.querySelectorAll('input[data-package-type="remote"]:checked');
  for (const checkbox of remoteCheckboxes) {
    const setName = checkbox.getAttribute('data-set-name');
    if (setName) {
      try {
        const set = await getSet(setName);
        if (set && Array.isArray(set.words)) {
          combinedWords.push(...set.words.map(w => ({ ...w, source: `remote-${setName}` })));
        }
      } catch (e) {
        console.error(`Błąd ładowania zestawu ${setName}:`, e);
      }
    }
  }
  
  const customWords = getCustomWordsArrayFromTextarea();
  if (customWords.length > 0) {
    combinedWords.push(...customWords.map(w => ({...w, source: 'custom' })));
    saveToStorage('slowkaCustomWords', customWords);
  } else {
    const savedCustom = loadFromStorage('slowkaCustomWords');
    if (savedCustom && savedCustom.length > 0) {
      combinedWords.push(...savedCustom.map(w => ({...w, source: 'custom' })));
    }
  }
}

function showWord() {
  if (pool.length === 0) {
    displayWord(null, false, previous);
    if (autoMode) stopAutoMode();
    return;
  }
  
  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (previous && pool.length > 1 && pool[index].hint === previous.hint && pool[index].answer === previous.answer);

  current = pool[index];
  wasSkipped = false;
  
  displayWord(current, false, previous);
  updateProgressUI(used.length, combinedWords.length);
}

function skipWord() {
  wasSkipped = true;
  displayWord(current, true, previous);
}

function nextWord() {
  if (!current) return;
  
  if (!wasSkipped) {
    used.push(current);
    saveToStorage('slowkaUsed', used);
    pool = pool.filter(w => w !== current);
  }
  previous = current;
  showWord();
}

function restart() {
  saveToStorage('slowkaUsed', []);
  used = [];
  pool = [...combinedWords];
  previous = null;
  current = null;
  wasSkipped = false;
  showWord();
}

function undoKnownWord() {
    if (!previous) return alert('Brak poprzedniego słowa do cofnięcia!');
    
    const idx = used.findIndex(w => w.answer === previous.answer && w.hint === previous.hint);
    if (idx === -1) return alert('Poprzednie słowo nie było oznaczone jako znane.');
    
    used.splice(idx, 1);
    saveToStorage('slowkaUsed', used);

    if (!pool.some(w => w.answer === previous.answer && w.hint === previous.hint)) {
        pool.push(previous);
    }
    
    current = previous; 
    previous = used.length > 0 ? used[used.length - 1] : null;
    wasSkipped = false;

    displayWord(current, false, previous, "Poprzednie słowo cofnięte.");
    updateProgressUI(used.length, combinedWords.length);
}

function toggleAutoMode() {
    if (!autoMode) {
        startAutoMode();
    } else {
        stopAutoMode();
    }
}

function startAutoMode() {
  if (autoMode) return;
  autoMode = true;
  saveToStorage('slowkaAutoMode', 'true');
  autoStep = 0;
  autoNextStep();
}

function stopAutoMode() {
  autoMode = false;
  saveToStorage('slowkaAutoMode', 'false');
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = null;
  cancelSpeech();
}

function autoNextStep() {
  if (!autoMode || !current) {
      if(autoMode && pool.length === 0){
          stopAutoMode();
          displayWord(null, false, previous);
      }
      return;
  }
  
  const multiplier = parseFloat(loadFromStorage('slowkaTimeMultiplier') || 1.0);
  const hintLength = current.hint ? current.hint.length : 0;
  const answerLength = current.answer ? current.answer.length : 0;
  
  const baseHintDelay = Math.max(3, 2 + (hintLength + answerLength) * 0.08);
  const baseAnswerDelay = Math.max(2, 1 + answerLength * 0.08);
  
  const hintDelay = Math.round(baseHintDelay * multiplier) * 1000;
  const answerDelay = Math.round(baseAnswerDelay * multiplier) * 1000;
  
  const answerLang = document.getElementById('answer-lang-select').value || 'en-US';

  if (autoStep === 0) {
    speak(current.hint, 'pl-PL');
    autoTimer = setTimeout(() => {
      skipWord();
      autoStep = 1;
      autoNextStep();
    }, hintDelay);
  } else if (autoStep === 1) {
    speak(current.answer, answerLang);
    autoTimer = setTimeout(() => {
      nextWord();
      autoStep = 0;
      autoNextStep();
    }, answerDelay);
  }
}

function saveCurrentWordToMemory() {
    if (!current) return alert('Brak aktualnego słowa!');
    const mem = loadFromStorage('slowkaMemory') || [];
    if (!mem.some(w => w.answer === current.answer && w.hint === current.hint)) {
        mem.push(current);
        saveToStorage('slowkaMemory', mem);
        return true;
    }
    alert('To słowo już jest w pamięci.');
    return false;
}

function savePreviousWordToMemory() {
    if (!previous) return alert('Brak poprzedniego słowa!');
    const mem = loadFromStorage('slowkaMemory') || [];
    if (!mem.some(w => w.answer === previous.answer && w.hint === previous.hint)) {
        mem.push(previous);
        saveToStorage('slowkaMemory', mem);
        return true;
    }
    alert('To słowo już jest w pamięci.');
    return false;
}

function clearUsed() {
    if (confirm('Czy na pewno chcesz wyczyścić historię odgadniętych słówek i zacząć od nowa?')) {
        saveToStorage('slowkaUsed', []);
        used = [];
        pool = [...combinedWords];
        previous = null;
        showWord();
        clearUsedWordsUI();
    }
}

async function refreshRemoteSetsList() {
    const currentFilter = document.getElementById('remote-search').value;
    try {
        const cachedData = loadFromStorage('slowkaRemoteSetsCache');
        if (cachedData && Array.isArray(cachedData.sets)) {
            remoteSets = cachedData.sets;
            filterRemoteSets(currentFilter);
        }
    } catch (e) {
        console.warn("Could not load remote sets from cache", e);
    }

    try {
        const data = await getSets();
        const hasNewData = Array.isArray(data.sets) && JSON.stringify(data.sets) !== JSON.stringify(remoteSets);

        if (hasNewData) {
            remoteSets = data.sets;
            saveToStorage('slowkaRemoteSetsCache', { sets: remoteSets, timestamp: Date.now() });
            filterRemoteSets(currentFilter);
        }
    } catch (e) {
        console.error("Failed to fetch remote sets from API:", e);
        renderAllPackages(localPackagesConfig, remoteSets, true); // Render with error
    }
}

function filterRemoteSets(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const filtered = term
      ? remoteSets.filter(set => set.name.toLowerCase().includes(term))
      : remoteSets;
    renderAllPackages(localPackagesConfig, filtered);
}

function getCustomWordsArrayFromTextarea() {
    const el = document.getElementById('custom-words-input');
    if (!el) return [];
    const val = el.value.trim();
    if (!val) return [];
    try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter(o => o && typeof o.hint === 'string' && typeof o.answer === 'string');
    } catch (e) {
        return val.split('\n')
            .map(line => line.split(/ - |;|\t/))
            .filter(parts => parts.length >= 2)
            .map(parts => ({ hint: parts[0].trim(), answer: parts.slice(1).join(' ').trim() }));
    }
    return [];
}

async function saveCustomSetToApi() {
    const nameInput = document.getElementById('remote-set-name');
    const langInput = document.getElementById('remote-set-language');
    const typeInput = document.getElementById('remote-set-type');
    
    const name = (nameInput.value || '').trim();
    const selectedLanguage = langInput.value;
    const type = typeInput.value;

    // Mapowanie kategorii językowych dla API
    const languageMapping = {
        'Angielski': 'en',
        'Hiszpański': 'es'
    };
    const language = languageMapping[selectedLanguage] || selectedLanguage;

    if (!name) return alert('Podaj nazwę zestawu.');
    if (!language) return alert('Wybierz język zestawu.');
    if (!type) return alert('Wybierz typ zestawu (słówka/zdania).');

    const words = getCustomWordsArrayFromTextarea();
    if (words.length === 0) return alert('Brak poprawnych słówek do zapisania.');

    try {
        const data = await saveSet(name, words, language, type);
        alert(`Zapisano zestaw "${name}" (${data.count} słów).`);
        document.getElementById('custom-words-input').value = '';
        nameInput.value = '';
        langInput.value = '';
        typeInput.value = '';
        saveToStorage('slowkaCustomWords', null);
        updateStartButton(localPackages, remoteSets);
        refreshRemoteSetsList();
    } catch (e) {
        alert('Błąd zapisu: ' + e.message);
    }
}

async function deleteRemoteSetFromApi() {
    const nameInput = document.getElementById('remote-set-name');
    const name = (nameInput.value || '').trim();
    if (!name) return alert('Wpisz nazwę zestawu do usunięcia.');
    if (!confirm(`Usunąć zestaw "${name}" z API?`)) return;

    try {
        await deleteSet(name);
        alert(`Usunięto zestaw "${name}".`);
        refreshRemoteSetsList();
    } catch (e) {
        alert('Błąd usuwania: ' + e.message);
    }
}