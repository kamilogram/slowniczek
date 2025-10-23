// --- API config ---

// --- Wyświetlanie dostępnych głosów ---
document.addEventListener('DOMContentLoaded', function() {
  const showVoicesBtn = document.getElementById('show-voices-btn');
  const voicesListDiv = document.getElementById('voices-list');
  if (showVoicesBtn && voicesListDiv) {
    showVoicesBtn.onclick = function() {
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      // Niektóre przeglądarki wymagają wywołania getVoices po onvoiceschanged
      if (!voices.length && typeof synth.onvoiceschanged !== 'undefined') {
        synth.onvoiceschanged = function() {
          voices = synth.getVoices();
          renderVoicesList(voices);
        };
      } else {
        renderVoicesList(voices);
      }
    };
    function renderVoicesList(voices) {
      if (!voices || !voices.length) {
        voicesListDiv.innerHTML = '<em>Brak dostępnych głosów. Upewnij się, że Twoja przeglądarka i system obsługują syntezę mowy.</em>';
        voicesListDiv.style.display = 'block';
        return;
      }
      voicesListDiv.innerHTML = '<b>Dostępne głosy:</b><br>' + voices.map(v =>
        `<div style='margin-bottom:4px;'><b>${v.name}</b> <span style='color:#555;'>(${v.lang})</span>${v.default ? ' <span style=\"color:green;\">[domyślny]</span>' : ''}</div>`
      ).join('');
      voicesListDiv.style.display = 'block';
    }
  }
});
const API_BASE = 'https://slowka-backend.onrender.com';
// --- Zaznaczanie fragmentu tekstu ---
let selectedFragment = null;
function getSelectedTextInElement(element) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return null;
  return selection.toString().trim();
}
function handleFragmentSelection(type, element) {
  const text = getSelectedTextInElement(element);
  if (text) {
    selectedFragment = {type, text};
    element.classList.add('highlight-selected');
    if (type === 'hint') document.getElementById('answer').classList.remove('highlight-selected');
    if (type === 'answer') document.getElementById('hint').classList.remove('highlight-selected');
  }
}
document.getElementById('hint').addEventListener('mouseup', function() {
  handleFragmentSelection('hint', this);
});
document.getElementById('answer').addEventListener('mouseup', function() {
  handleFragmentSelection('answer', this);
});
// Obsługa dotyku na smartfonach
document.getElementById('hint').addEventListener('touchend', function() {
  setTimeout(() => handleFragmentSelection('hint', this), 100);
});
document.getElementById('answer').addEventListener('touchend', function() {
  setTimeout(() => handleFragmentSelection('answer', this), 100);
});
function clearSelectedHighlight() {
  document.getElementById('hint').classList.remove('highlight-selected');
  document.getElementById('answer').classList.remove('highlight-selected');
  selectedFragment = null;
  window.getSelection().removeAllRanges();
}
// Przycisk do dodawania dowolnie zaznaczonego tekstu (np. na mobilnych)
window.addEventListener('DOMContentLoaded', function() {
  const globalBtn = document.getElementById('save-global-selection-btn');
  if (globalBtn) {
    globalBtn.onclick = function() {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (!text) return alert('Nie zaznaczono tekstu!');
      // Spróbuj określić typ na podstawie miejsca zaznaczenia
      let type = null;
      const hintEl = document.getElementById('hint');
      const answerEl = document.getElementById('answer');
      if (hintEl.contains(selection.anchorNode)) type = 'hint';
      else if (answerEl.contains(selection.anchorNode)) type = 'answer';
      else type = 'other';
      const fragMem = getFragmentMemory();
      if (!fragMem.some(w => w.text === text && w.type === type)) {
        fragMem.push({text, type});
        setFragmentMemory(fragMem);
        this.classList.add('highlight-green');
        setTimeout(() => {
          this.classList.remove('highlight-green');
        }, 2000);
        clearSelectedHighlight();
        // Aktualizuj listę fragmentów po przecinku jeśli jest widoczna
        const fragList = document.getElementById('fragment-memory-list-comma');
        if (fragList && fragList.style.display !== 'none') {
          renderFragmentMemoryComma();
        }
      } else {
        alert('Ten fragment już jest w pamięci.');
      }
    };
  }
});
    // Zmienne globalne
    let allPackages = {}; // Wszystkie dostępne pakiety
    let selectedPackages = []; // Wybrane pakiety
    let combinedWords = []; // Połączone wybrane pakiety
    let pool = [];
    let used = [];
    let current = null;
    let previous = null;
    let isListening = false;
    let wasSkipped = false;
    let autoMode = false;
    let autoTimer = null;
    let autoStep = 0;
    let autoTimeLeft = 0;
    let speakHintActive = false;
    let voiceRate = 1.0;

        // ...usunięto generator białego szumu...

    // --- Inicjalizacja pakietów ---
    function initializePackages() {
      // Zbierz wszystkie dostępne pakiety
      allPackages = {
        allWords: window.allWords || [],
        allWords2: window.allWords2 || [],
        easiest: window.easiest || []
      };
      
      // Aktualizuj liczniki słów
      updatePackageCounts();
      
      // Załaduj zapisane wybory
      loadSavedPackages();
      
      // Dodaj event listeners
      setupPackageSelection();

      // Prefill i autozapis własnych słówek
      const customInput = document.getElementById('custom-words-input');
      if (customInput) {
        // Jeśli w storage są zapisane słówka i pole jest puste – wypełnij je
        try {
          const savedCustom = JSON.parse(localStorage.getItem('slowkaCustomWords') || '[]');
          if (Array.isArray(savedCustom) && savedCustom.length > 0 && !customInput.value.trim()) {
            customInput.value = JSON.stringify(savedCustom);
          }
        } catch (_) {}

        // Autouzup. stanu przy starcie
        updateStartButton();

        // Autosejw przy wpisywaniu (z prostą walidacją)
        customInput.addEventListener('input', function() {
          const val = customInput.value.trim();
          if (!val) {
            localStorage.removeItem('slowkaCustomWords');
            document.getElementById('custom-words-error').style.display = 'none';
            updateStartButton();
            return;
          }
          
          // Użyj tej samej logiki parsowania co getCustomWordsArrayFromTextarea
          const arr = getCustomWordsArrayFromTextarea();
          if (Array.isArray(arr) && arr.length > 0) {
            const valid = arr.filter(o => o && typeof o.hint === 'string' && typeof o.answer === 'string');
            if (valid.length > 0) {
              localStorage.setItem('slowkaCustomWords', JSON.stringify(valid));
              document.getElementById('custom-words-error').style.display = 'none';
            } else {
              localStorage.removeItem('slowkaCustomWords');
            }
          } else {
            localStorage.removeItem('slowkaCustomWords');
          }
          updateStartButton();
        });
      }

      // Inicjalizacja UI API
      setupRemoteSetsUI();
    }
    
    function updatePackageCounts() {
      const allWordsCount = document.getElementById('allWords-count');
      const allWords2Count = document.getElementById('allWords2-count');
      const easiestCount = document.getElementById('easiest-count');
      
      if (allWordsCount) allWordsCount.textContent = `${allPackages.allWords.length} słów`;
      if (allWords2Count) allWords2Count.textContent = `${allPackages.allWords2.length} słów`;
      if (easiestCount) easiestCount.textContent = `${allPackages.easiest.length} słów`;
    }
    
    function loadSavedPackages() {
      const saved = localStorage.getItem('slowkaSelectedPackages');
      if (saved) {
        selectedPackages = JSON.parse(saved);
        // Zaznacz zapisane pakiety
        selectedPackages.forEach(pkg => {
          const checkbox = document.getElementById(pkg);
          if (checkbox) checkbox.checked = true;
        });
        updateStartButton();
      }
    }
    
    function setupPackageSelection() {
      // Event listeners dla checkboxów
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateStartButton);
      });
      
      // Event listener dla przycisku start
      document.getElementById('start-btn').addEventListener('click', startApplication);
      
      // Event listener dla przycisku zmiany pakietów
      document.getElementById('change-packages-btn').addEventListener('click', showPackageSelection);
    }
    
    function updateStartButton() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const startBtn = document.getElementById('start-btn');
      const selectedInfo = document.getElementById('selected-info');
      const customInput = document.getElementById('custom-words-input');
      let customCount = 0;
      if (customInput && customInput.value.trim()) {
        // Użyj tej samej logiki parsowania co getCustomWordsArrayFromTextarea
        const arr = getCustomWordsArrayFromTextarea();
        if (Array.isArray(arr)) {
          customCount = arr.filter(obj => obj && typeof obj.hint === 'string' && typeof obj.answer === 'string').length;
        }
      } else {
        // Jeśli pole puste, sprawdź lokalny storage
        try {
          const saved = JSON.parse(localStorage.getItem('slowkaCustomWords') || '[]');
          if (Array.isArray(saved)) customCount = saved.length;
        } catch (_) {}
      }
      // Sprawdź remote sets
      const remoteCheckboxes = document.querySelectorAll('input[data-package^="remote-"]:checked');
      const remoteCount = Array.from(remoteCheckboxes).reduce((total, checkbox) => {
        const setName = checkbox.getAttribute('data-set-name');
        const set = remoteSets.find(s => s.name === setName);
        return total + (set ? set.count : 0);
      }, 0);
      
      if (checkboxes.length > 0 || customCount > 0 || remoteCount > 0) {
        startBtn.disabled = false;
        const totalWords = Array.from(checkboxes).reduce((total, checkbox) => {
          const packageName = checkbox.id;
          return total + (allPackages[packageName] ? allPackages[packageName].length : 0);
        }, 0);
        
        const parts = [];
        if (checkboxes.length > 0) parts.push(`${checkboxes.length} pakiet(ów) - ${totalWords} słów`);
        if (remoteCount > 0) parts.push(`${remoteCheckboxes.length} zestaw(ów) API - ${remoteCount} słów`);
        if (customCount > 0) parts.push(`${customCount} własnych`);
        
        selectedInfo.textContent = parts.join(' + ');
      } else {
        startBtn.disabled = true;
        selectedInfo.textContent = 'Wybierz co najmniej jeden pakiet, zestaw z API lub wklej własne słówka';
      }
    }
    
    async function startApplication() {
      // Zbierz wybrane pakiety
      selectedPackages = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.id);
      
      // Zapisz wybór
      localStorage.setItem('slowkaSelectedPackages', JSON.stringify(selectedPackages));
      
      // Pokaż loading
      const startBtn = document.getElementById('start-btn');
      const originalText = startBtn.textContent;
      startBtn.textContent = 'Ładowanie...';
      startBtn.disabled = true;
      
      try {
        // Połącz wybrane pakiety (teraz async)
        await combineSelectedPackages();
        
        // Ukryj stronę startową i pokaż aplikację
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        // Płynnie przewiń na górę strony
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Inicjalizuj aplikację
        initializeApp();

        // Sprawdź, czy tryb auto powinien być włączony automatycznie
        if (localStorage.getItem('slowkaAutoMode') === 'true') {
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
    
    // ...usunięto funkcję czytania na głos...

    // --- Aktualizacja struktury słówek ---
    async function combineSelectedPackages() {
      combinedWords = [];
      
      // Dodaj lokalne pakiety
      selectedPackages.forEach(packageName => {
        if (allPackages[packageName]) {
          allPackages[packageName].forEach(word => {
            combinedWords.push({
              ...word,
              hintLanguage: packageName === 'allWords' || packageName === 'allWords2' ? 'pl' : 'en',
              answerLanguage: packageName === 'allWords' || packageName === 'allWords2' ? 'pl' : 'en'
            });
          });
        }
      });
      
      // Dodaj remote sets
      const remoteCheckboxes = document.querySelectorAll('input[data-package^="remote-"]:checked');
      for (const checkbox of remoteCheckboxes) {
        const setName = checkbox.getAttribute('data-set-name');
        if (setName) {
          try {
            const resp = await fetch(`${API_BASE}/api/sets/${encodeURIComponent(setName)}`);
            const data = await resp.json();
            if (resp.ok && Array.isArray(data.words)) {
              data.words.forEach(word => {
                combinedWords.push({
                  ...word,
                  hintLanguage: 'pl',
                  answerLanguage: 'en',
                  source: `remote-${setName}`
                });
              });
            }
          } catch (e) {
            console.error(`Błąd ładowania zestawu ${setName}:`, e);
          }
        }
      }

      // Dodaj własne słówka jeśli są
      const customInput = document.getElementById('custom-words-input');
      const customError = document.getElementById('custom-words-error');
      customError.style.display = 'none';
      if (customInput && customInput.value.trim()) {
        // Użyj tej samej logiki parsowania co getCustomWordsArrayFromTextarea
        const arr = getCustomWordsArrayFromTextarea();
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach(obj => {
            if (obj && typeof obj.hint === 'string' && typeof obj.answer === 'string') {
              combinedWords.push({
                hint: obj.hint,
                answer: obj.answer,
                hintLanguage: 'pl',
                answerLanguage: 'en',
                source: 'custom'
              });
            }
          });
          // Zapisz poprawnie sparsowane własne słówka do localStorage
          try { localStorage.setItem('slowkaCustomWords', JSON.stringify(arr)); } catch (_) {}
        } else {
          customError.textContent = 'Wklej poprawną tablicę obiektów!';
          customError.style.display = 'block';
        }
      } else {
        // Jeśli pole jest puste, ale są zapisane własne słówka – dołącz je
        try {
          const saved = JSON.parse(localStorage.getItem('slowkaCustomWords') || '[]');
          if (Array.isArray(saved) && saved.length > 0) {
            saved.forEach(obj => {
              if (obj && typeof obj.hint === 'string' && typeof obj.answer === 'string') {
                combinedWords.push({
                  hint: obj.hint,
                  answer: obj.answer,
                  hintLanguage: 'pl',
                  answerLanguage: 'en',
                  source: 'custom'
                });
              }
            });
          }
        } catch (_) {}
      }

      // Ustaw window.allWords dla kompatybilności
      window.allWords = combinedWords;
    }
    
    function showPackageSelection() {
      // Zatrzymaj aplikację jeśli działa
      if (autoMode) {
        stopAutoMode();
      }
      
      // Pokaż stronę startową
      document.getElementById('main-app').style.display = 'none';
      document.getElementById('start-screen').style.display = 'flex';
      
      // Zaktualizuj przycisk start
      updateStartButton();
      // Odśwież listę zestawów z API gdy wracamy do ekranu startowego
      refreshRemoteSetsList();
    }
    
    function initializeApp() {
      // Inicjalizacja puli i statystyki
      used = getUsedWords();
      pool = combinedWords.filter(w => !used.some(u => u.answer === w.answer && u.hint === w.hint));
      
      // Pokaż pierwsze słowo
      showWord();
    }

    // --- Remote sets (API) ---
    function getCustomWordsArrayFromTextarea() {
      const el = document.getElementById('custom-words-input');
      if (!el) return [];
      const val = el.value.trim();
      if (!val) return [];
      
      // 1) Spróbuj najpierw standardowy JSON
      try { 
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
      
      // 2) Jeśli nie JSON, spróbuj JavaScript (bezpiecznie)
      try {
        // Sprawdź czy wygląda jak tablica JavaScript
        if (val.startsWith('[') && val.endsWith(']')) {
          // Usuń nowe linie i nadmiarowe spacje dla bezpieczeństwa
          const cleanVal = val.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ');
          
          // Użyj Function constructor zamiast eval (bezpieczniejsze)
          const func = new Function('return ' + cleanVal);
          const result = func();
          
          if (Array.isArray(result)) return result;
        }
      } catch (_) {}
      
      // 3) Prosty format linijkowy: "hint - answer" / "hint;answer" / "hint,answer" / "hint -> answer"
      const lines = val.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const pairs = [];
      for (const line of lines) {
        if (line.startsWith('#')) continue; // komentarze
        const m = line.split(/\s*(?:-|;|,|->)\s*/);
        if (m.length >= 2) {
          const hint = m[0];
          const answer = m.slice(1).join(' ');
          if (hint && answer) pairs.push({ hint, answer });
        }
      }
      return pairs;
    }

    function setCustomWordsArrayToTextarea(arr) {
      const el = document.getElementById('custom-words-input');
      if (!el) return;
      el.value = JSON.stringify(arr, null, 2);
      // Zapisz lokalnie też
      try { localStorage.setItem('slowkaCustomWords', JSON.stringify(arr)); } catch (_) {}
      updateStartButton();
    }

    let remoteSets = [];
    let filteredRemoteSets = [];

     async function refreshRemoteSetsList() {
      const list = document.getElementById('remote-sets-list');
      if (!list) return;

      // 1. Spróbuj załadować z cache'u i od razu wyświetlić
      try {
        const cachedData = JSON.parse(localStorage.getItem('slowkaRemoteSetsCache'));
        if (cachedData && Array.isArray(cachedData.sets)) {
          remoteSets = cachedData.sets;
          filteredRemoteSets = [...remoteSets];
          renderRemoteSets();
        }
      } catch (e) {
        console.warn("Could not load remote sets from cache", e);
      }
      
      // 2. W tle, pobierz świeże dane z API
      try {
        const resp = await fetch(`${API_BASE}/api/sets`);
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const data = await resp.json();
        
        // 3. Zaktualizuj UI i cache jeśli dane się zmieniły
        if (Array.isArray(data.sets) && JSON.stringify(data.sets) !== JSON.stringify(remoteSets)) {
          remoteSets = data.sets;
          localStorage.setItem('slowkaRemoteSetsCache', JSON.stringify({ sets: remoteSets, timestamp: Date.now() }));
          // Zastosuj aktualny filtr do nowej listy
          const currentFilter = document.getElementById('remote-search').value;
          filterRemoteSets(currentFilter);
        }
      } catch (e) {
        if (remoteSets.length === 0) { // Tylko pokaż błąd jeśli nie ma nic z cache
          list.innerHTML = '<div class="loading-placeholder">Błąd pobierania listy</div>';
        }
        console.error("Failed to fetch remote sets from API:", e);
      }
    }

    function renderRemoteSets() {
      const list = document.getElementById('remote-sets-list');
      if (!list) return;
      
      if (filteredRemoteSets.length === 0) {
        list.innerHTML = '<div class="loading-placeholder">Brak zestawów</div>';
        return;
      }
      
      list.innerHTML = filteredRemoteSets.map(set => `
        <label class="package-item">
          <input type="checkbox" id="remote-${set.name}" data-package="remote-${set.name}" data-set-name="${set.name}">
          <span class="package-name">${set.name}</span>
          <span class="package-count">${set.count} słów</span>
        </label>
      `).join('');
      
      // Dodaj event listeners dla nowych checkboxów
      setupRemotePackageSelection();
    }

    function filterRemoteSets(searchTerm) {
      if (!searchTerm.trim()) {
        // Jeśli pole wyszukiwania jest puste, pokaż wszystkie zestawy
        filteredRemoteSets = [...remoteSets];
      } else {
        const term = searchTerm.toLowerCase();
        filteredRemoteSets = remoteSets.filter(set => 
          set.name.toLowerCase().includes(term)
        );
      }
      renderRemoteSets();
    }

    function setupRemotePackageSelection() {
      // Dodaj event listeners dla checkboxów remote sets
      document.querySelectorAll('input[data-package^="remote-"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateStartButton);
      });
    }

    function setupRemoteSetsUI() {
      const btnRefresh = document.getElementById('btn-refresh-remote');
      const btnSave = document.getElementById('btn-save-remote');
      const btnDelete = document.getElementById('btn-delete-remote');
      const nameInput = document.getElementById('remote-set-name');
      const searchInput = document.getElementById('remote-search');
      
      if (!btnRefresh || !btnSave || !btnDelete || !nameInput || !searchInput) return;

      btnRefresh.onclick = refreshRemoteSetsList;
      
      // Wyszukiwarka z debouncing
      let searchTimeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          filterRemoteSets(this.value);
        }, 300);
      });
      
      refreshRemoteSetsList();

      btnSave.onclick = async function() {
        const name = (nameInput.value || '').trim();
        if (!name) return alert('Podaj nazwę zestawu.');
        const words = getCustomWordsArrayFromTextarea();
        const valid = words.filter(o => o && typeof o.hint === 'string' && typeof o.answer === 'string' && o.hint && o.answer);
        if (!valid.length) return alert('Brak słówek do zapisania. Użyj np. linii "pies - dog" lub tablicy [{"hint":"pies","answer":"dog"}].');
        try {
          const resp = await fetch(`${API_BASE}/api/sets/${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: valid })
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data && data.error ? data.error : 'Błąd zapisu');
          alert(`Zapisano zestaw "${name}" (${data.count} słów).`);
          
          // Wyczyść pola po udanym zapisie
          const customInput = document.getElementById('custom-words-input');
          const nameInput = document.getElementById('remote-set-name');
          if (customInput) customInput.value = '';
          if (nameInput) nameInput.value = '';
          
          // Wyczyść localStorage
          localStorage.removeItem('slowkaCustomWords');
          
          // Zaktualizuj przycisk start
          updateStartButton();
          
          refreshRemoteSetsList();
        } catch (e) {
          alert('Błąd zapisu: ' + e.message);
        }
      };

      btnDelete.onclick = async function() {
        const name = (nameInput.value || '').trim();
        if (!name) return alert('Wpisz nazwę zestawu do usunięcia.');
        if (!confirm(`Usunąć zestaw "${name}" z API?`)) return;
        try {
          const resp = await fetch(`${API_BASE}/api/sets/${encodeURIComponent(name)}`, { method: 'DELETE' });
          if (!resp.ok) throw new Error('Błąd usuwania');
          alert(`Usunięto zestaw "${name}".`);
          refreshRemoteSetsList();
        } catch (e) {
          alert('Błąd usuwania: ' + e.message);
        }
      };
    }

    function updateProgress() {
      document.getElementById("progress").textContent = `Słówko ${used.length + 1} z ${combinedWords.length}`;
    }

    function showWord() {
      if (pool.length === 0) {
        document.getElementById("hint").textContent = "🎉 Ukończyłeś wszystkie słówka!";
        document.getElementById("hint").className = "";
        document.getElementById("answer").textContent = "";
        document.getElementById("answer").style.visibility = "hidden";
        document.getElementById("progress").textContent = "";
        document.getElementById("last-word").textContent = "";
        document.getElementById("restart-btn").style.display = "inline-block";
        if (autoMode) stopAutoMode(); // wyłącz tryb automatyczny po ukończeniu
        return;
      }
      document.getElementById("restart-btn").style.display = "none";
      // Losuj słowo, ale nie to samo co poprzednie
      let index;
      if (pool.length === 1) {
        index = 0;
      } else {
        do {
          index = Math.floor(Math.random() * pool.length);
        } while (previous && pool[index].hint === previous.hint && pool[index].answer === previous.answer && pool.length > 1);
      }
      current = pool[index];
      wasSkipped = false;
      
      const hintElement = document.getElementById("hint");
      hintElement.textContent = current.hint;
      
      // Apply styling based on word source
      if (current.source === 'allWordsEnglish') {
        hintElement.className = 'english-hint';
      } else {
        hintElement.className = '';
      }
      
      document.getElementById("answer").textContent = current.answer;
      document.getElementById("answer").style.visibility = "hidden";
      updateProgress();
      // Czytaj hint na głos tylko w trybie auto
      if (autoMode) {
        const hintLang = document.getElementById('hint-lang-select').value;
        if (current.hint) {
          const utterHint = new window.SpeechSynthesisUtterance(current.hint);
          utterHint.lang = hintLang;
          utterHint.volume = 0.8;
          utterHint.rate = 1.0;
          window.speechSynthesis.speak(utterHint);
        }
      }
    }
    // --- Nowa funkcja czytania na głos ---
    function speakCurrent() {
      const hintLang = document.getElementById('hint-lang-select').value;
      const answerLang = document.getElementById('answer-lang-select').value;
      if (!current) return;
      // Czytaj hint
      if (current.hint) {
        const utterHint = new window.SpeechSynthesisUtterance(current.hint);
        utterHint.lang = hintLang;
        utterHint.volume = 0.8;
        utterHint.rate = 1.0;
        window.speechSynthesis.speak(utterHint);
      }
      // Czytaj answer
      if (current.answer) {
        const utterAnswer = new window.SpeechSynthesisUtterance(current.answer);
        utterAnswer.lang = answerLang;
        utterAnswer.volume = 0.8;
        utterAnswer.rate = 1.0;
        window.speechSynthesis.speak(utterAnswer);
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      const speakBtn = document.getElementById('speak-btn');
      if (speakBtn) speakBtn.onclick = speakCurrent;
    });

    function skipWord() {
      wasSkipped = true;
      document.getElementById("answer").style.visibility = "visible";
      document.querySelector('button[onclick="nextWord()"]').textContent = "Dalej";
      // Czytaj answer na głos tylko w trybie auto
      if (autoMode) {
        const answerLang = document.getElementById('answer-lang-select').value;
        if (current.answer) {
          const utterAnswer = new window.SpeechSynthesisUtterance(current.answer);
          utterAnswer.lang = answerLang;
          utterAnswer.volume = 0.8;
          utterAnswer.rate = 1.0;
          window.speechSynthesis.speak(utterAnswer);
        }
      }
    }

    function nextWord() {
      if (!wasSkipped) {
        previous = current;
        document.getElementById("last-word").innerHTML = `Poprzednie hasło: <span class='last-word-green'>${previous.answer}</span>`;
        pool = pool.filter(w => w !== current);
        used.push(current);
        setUsedWords(used);
      } else {
        previous = current;
        document.getElementById("last-word").innerHTML = `Poprzednie hasło: <span class='last-word-green'>${previous.answer}</span>`;
      }
      wasSkipped = false;
      document.querySelector('button[onclick="nextWord()"]').textContent = "Wiem";
      showWord();
    }

    function restart() {
      setUsedWords([]); // Wyczyść historię odgadniętych słówek
      used = [];
      pool = [...combinedWords];
      previous = null;
      wasSkipped = false;
      document.getElementById("restart-btn").style.display = "none";
      document.getElementById("progress").textContent = "";
      document.getElementById("last-word").textContent = "";
      document.getElementById("answer").style.visibility = "hidden";
      document.querySelector('button[onclick="nextWord()"]').textContent = "Wiem";
      showWord();
      if (isListening) recognition.start();
    }

    let touchStartX = 0;
    document.addEventListener("touchstart", e => {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener("touchend", e => {
      const deltaX = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
          nextWord(); // przesunięcie w lewo
        } else {
          skipWord(); // przesunięcie w prawo
        }
      }
    });

    // --- Pamięć słówek ---
// --- Pamięć fragmentów ---
function getFragmentMemory() {
  return JSON.parse(localStorage.getItem('slowkaFragmentMemory') || '[]');
}
function setFragmentMemory(arr) {
  localStorage.setItem('slowkaFragmentMemory', JSON.stringify(arr));
}

function renderFragmentMemoryComma() {
  const mem = getFragmentMemory();
  const list = document.getElementById('fragment-memory-list-comma');
  if (!list) return;
  if (!mem.length) {
    list.textContent = 'Brak zapamiętanych fragmentów.';
    list.style.display = 'block';
    return;
  }
  list.textContent = mem.map(w => w.text).join(', ');
  list.style.display = 'block';
}

function removeFragmentMemory(idx) {
  const mem = getFragmentMemory();
  mem.splice(idx,1);
  setFragmentMemory(mem);
  renderFragmentMemory();
}
    function getMemory() {
      return JSON.parse(localStorage.getItem('slowkaMemory') || '[]');
    }
    
    function setMemory(arr) {
      localStorage.setItem('slowkaMemory', JSON.stringify(arr));
    }

    // --- Zapamiętywanie odgadniętych słówek ---
    function getUsedWords() {
      return JSON.parse(localStorage.getItem('slowkaUsed') || '[]');
    }
    
    function setUsedWords(arr) {
      localStorage.setItem('slowkaUsed', JSON.stringify(arr));
    }



function renderMemory() {
  const mem = getMemory();
  const list = document.getElementById('memory-list');
  if (!mem.length) {
    list.innerHTML = '<em>Brak zapamiętanych słówek.</em>';
    return;
  }
  list.innerHTML = mem.map((w,i) => {
    if (w.type === 'hint') {
      return `<div class='memory-item'><div class='memory-item-content'><b>${w.answer}</b> <span class='memory-type'>(z podpowiedzi)</span></div><button onclick='removeMemory(${i})'>Usuń</button></div>`;
    } else if (w.type === 'answer') {
      return `<div class='memory-item'><div class='memory-item-content'><b>${w.answer}</b> <span class='memory-type'>(z odpowiedzi)</span></div><button onclick='removeMemory(${i})'>Usuń</button></div>`;
    } else {
      return `<div class='memory-item'><div class='memory-item-content'><b>${w.answer}</b> <span>${w.hint}</span></div><button onclick='removeMemory(${i})'>Usuń</button></div>`;
    }
  }).join('');
}
    
    function removeMemory(idx) {
      const mem = getMemory();
      mem.splice(idx,1);
      setMemory(mem);
      renderMemory();
    }
    
document.getElementById('save-selected-btn').onclick = function() {
  if (!selectedFragment || !selectedFragment.text) return alert('Nie zaznaczono fragmentu! Zaznacz fragment tekstu w podpowiedzi lub odpowiedzi.');
  const fragMem = getFragmentMemory();
  if (!fragMem.some(w => w.text === selectedFragment.text && w.type === selectedFragment.type)) {
    fragMem.push({text: selectedFragment.text, type: selectedFragment.type});
    setFragmentMemory(fragMem);
    this.classList.add('highlight-green');
    setTimeout(() => {
      this.classList.remove('highlight-green');
    }, 2000);
    clearSelectedHighlight();
    // Aktualizuj listę fragmentów po przecinku jeśli jest widoczna
    const fragList = document.getElementById('fragment-memory-list-comma');
    if (fragList && fragList.style.display !== 'none') {
      renderFragmentMemoryComma();
    }
  } else {
    alert('Ten fragment już jest w pamięci.');
  }
};

    
    document.getElementById('save-current-btn').onclick = function() {
      if (!current) return alert('Brak aktualnego słowa!');
      const mem = getMemory();
      if (!mem.some(w => w.answer === current.answer && w.hint === current.hint)) {
        mem.push({answer: current.answer, hint: current.hint});
        setMemory(mem);
        const btn = this;
        btn.classList.add('highlight-green');
        setTimeout(() => {
          btn.classList.remove('highlight-green');
        }, 2000);
      } else {
        alert('To słowo już jest w pamięci.');
      }
    };
    
    let memoryVisible = false;
    document.getElementById('show-memory-btn').onclick = function() {
      memoryVisible = !memoryVisible;
      const memoryList = document.getElementById('memory-list');
      memoryList.style.display = memoryVisible ? 'block' : 'none';
      this.textContent = memoryVisible ? 'Ukryj zapamiętane' : 'Pokaż zapamiętane';
      if (memoryVisible) {
        renderMemory();
        document.getElementById('memory-buttons').style.display = 'block';
      } else {
        document.getElementById('memory-buttons').style.display = 'none';
      }
    };


    function showAutoTimer(sec) {
      const timerDiv = document.getElementById('auto-timer');
      timerDiv.style.display = 'block';
      timerDiv.textContent = `⏱️ ${sec}s`;
    }
    
    function hideAutoTimer() {
      document.getElementById('auto-timer').style.display = 'none';
    }

    // ...usunięto obsługę widoczności elementów głosowych...

    function startAutoMode() {
      if (autoMode) return;
      autoMode = true;
      document.getElementById('auto-mode-btn').textContent = 'Wyłącz auto';
      document.querySelector('.buttons').style.display = 'none';
      document.getElementById('undo-known-btn').style.display = 'none';
      document.getElementById('show-memory-btn').style.display = 'none';
      autoStep = 0;
      document.getElementById('auto-mode-settings').style.display = 'flex';
      autoNextStep();
    }
    
    function stopAutoMode() {
      autoMode = false;
      document.getElementById('auto-mode-btn').textContent = 'Auto tryb';
      document.querySelector('.buttons').style.display = '';
      document.getElementById('undo-known-btn').style.display = '';
      document.getElementById('show-memory-btn').style.display = '';
      hideAutoTimer();
      document.getElementById('auto-mode-settings').style.display = 'none';
      if (autoTimer) clearTimeout(autoTimer);
    }
    
    function autoNextStep() {
        if (!autoMode || !current) return;

        const BASE_HINT_SECONDS = 2;
        const BASE_ANSWER_SECONDS = 1;
        const SECONDS_PER_CHAR = 0.08; // 80ms na znak
        const multiplier = parseFloat(document.getElementById('time-multiplier-slider').value) || 1.0;

        const hintLength = current.hint ? current.hint.length : 0;
        const answerLength = current.answer ? current.answer.length : 0;

        // Czas na podpowiedź (myślenie) zależy od długości podpowiedzi ORAZ odpowiedzi
        let baseHintDelay = Math.max(3, BASE_HINT_SECONDS + (hintLength + answerLength) * SECONDS_PER_CHAR);
        // Czas na przeczytanie odpowiedzi zależy tylko od długości odpowiedzi
        let baseAnswerDelay = Math.max(2, BASE_ANSWER_SECONDS + answerLength * SECONDS_PER_CHAR);
        
        const hintDelay = Math.round(baseHintDelay * multiplier);
        const answerDelay = Math.round(baseAnswerDelay * multiplier);

        if (autoStep === 0) { // Czas na podpowiedź
            autoTimeLeft = hintDelay;
            showAutoTimer(autoTimeLeft);
            autoTimer = setInterval(() => {
                autoTimeLeft--;
                showAutoTimer(autoTimeLeft);
                if (autoTimeLeft <= 0) {
                    clearInterval(autoTimer);
                    skipWord();
                    autoStep = 1;
                    autoNextStep();
                }
            }, 1000);
        } else if (autoStep === 1) { // Czas na odpowiedź
            autoTimeLeft = answerDelay;
            showAutoTimer(autoTimeLeft);
            autoTimer = setInterval(() => {
                autoTimeLeft--;
                showAutoTimer(autoTimeLeft);
                if (autoTimeLeft <= 0) {
                    clearInterval(autoTimer);
                    nextWord();
                    autoStep = 0;
                    autoNextStep();
                }
            }, 1000);
        }
    }
    
    document.getElementById('auto-mode-btn').onclick = function() {
      if (!autoMode) {
        startAutoMode();
        localStorage.setItem('slowkaAutoMode', 'true');
        document.getElementById('lang-select-container').style.display = 'flex';
      } else {
        stopAutoMode();
        localStorage.setItem('slowkaAutoMode', 'false');
        document.getElementById('lang-select-container').style.display = 'none';
      }
    };

    document.getElementById('toggle-dark-mode-btn').onclick = function() {
      const body = document.body;
      const autoBtn = document.getElementById('auto-mode-btn');
      const darkBtn = document.getElementById('toggle-dark-mode-btn');
      if (!body.classList.contains('dark-mode')) {
        body.classList.add('dark-mode');
        this.textContent = 'Tryb dzienny';
        document.getElementById('auto-timer').style.color = '#b3e0ff';
        
        // Zapisz preferencję trybu ciemnego
        localStorage.setItem('slowkaDarkMode', 'true');
      } else {
        body.classList.remove('dark-mode');
        this.textContent = 'Tryb nocny';
        document.getElementById('auto-timer').style.color = '#005a9e';
        
        // Zapisz preferencję trybu jasnego
        localStorage.setItem('slowkaDarkMode', 'false');
      }
    };

    document.getElementById('undo-known-btn').onclick = function() {
      if (!previous) return alert('Brak poprzedniego słowa do cofnięcia!');
      // Sprawdź czy previous jest w used
      const idx = used.findIndex(w => w.answer === previous.answer && w.hint === previous.hint);
      if (idx === -1) return alert('Poprzednie słowo nie było oznaczone jako znane.');
      used.splice(idx, 1);
      setUsedWords(used);
      // Dodaj z powrotem do pool jeśli nie ma
      if (!pool.some(w => w.answer === previous.answer && w.hint === previous.hint)) {
        pool.push(previous);
      }
      showWord();
      document.getElementById('last-word').innerHTML = 'Poprzednie cofnięte.';
    };

    function searchWord() {
      const query = document.getElementById('search-input').value.toLowerCase();
      const resultsDiv = document.getElementById('search-results');
      if (query.length < 2) {
        resultsDiv.innerHTML = '<p class="search-results-placeholder">Wpisz co najmniej 2 litery, aby wyszukać.</p>';
        return;
      }
      const results = combinedWords.filter(word => {
        if (!word || typeof word.answer !== 'string' || typeof word.hint !== 'string') return false;
        return word.answer.toLowerCase().includes(query) || word.hint.toLowerCase().includes(query);
      });
      if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="search-results-placeholder">Brak wyników.</p>';
        return;
      }
      resultsDiv.innerHTML = results.map(word => 
        `<div class="search-result-item">
          <b>${word.answer}</b>
          <p>${word.hint}</p>
        </div>`
      ).join('');
    }

    document.getElementById('search-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        searchWord();
      }
    });

    // --- Wake Lock API ---
    let wakeLock = null;
    
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
            // Jeśli jesteśmy w trybie auto, kontynuuj działanie w tle
            if (autoMode) {
              // Removed call to enableBackgroundMode();
            }
          });
        } catch (err) {
          console.log('Wake Lock request failed:', err);
        }
      }
    }

    // Ponownie aktywuj Wake Lock po wznowieniu strony
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    // Obsługa powiadomień
    // Usunięto automatyczne pytanie o pozwolenie na powiadomienia przy starcie

    // Aktywuj Wake Lock na starcie
    requestWakeLock();

    // Dodaj obsługę Page Visibility API dla lepszego wykrywania stanu aplikacji
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && autoMode) {
        console.log('Page hidden - continuing in background');
        // Removed call to enableBackgroundMode();
      } else if (!document.hidden) {
        console.log('Page visible - disabling background mode');
        // Removed call to disableBackgroundMode();
      }
    });
    

    
    // --- Inicjalizacja aplikacji ---
    // Poczekaj na załadowanie wszystkich skryptów
    window.addEventListener('load', function() {
  // Ukryj dodatkowe opcje na starcie
  document.getElementById('memory-buttons').style.display = 'none';
  document.getElementById('memory-list').style.display = 'none';
  document.getElementById('lang-select-container').style.display = 'none';
  document.getElementById('search-container').style.display = 'none';
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('other-options-btn-container').style.display = 'block';
  // Dodaj przycisk i kontener do fragmentów jako lista po przecinku
  if (!document.getElementById('show-fragment-memory-comma-btn')) {
    const btn = document.createElement('button');
    btn.id = 'show-fragment-memory-comma-btn';
    btn.textContent = 'Pokaż fragmenty jako listę';
    btn.className = 'show-fragment-memory-btn';
    btn.style.marginLeft = '8px';
    document.getElementById('memory-buttons').appendChild(btn);
    const fragList = document.createElement('div');
    fragList.id = 'fragment-memory-list-comma';
    fragList.style.display = 'none';
    fragList.style.marginTop = '8px';
    document.getElementById('memory-buttons').appendChild(fragList);
    // Dodaj przycisk "Usuń wszystkie fragmenty" poniżej listy fragmentów
    const clearFragmentsBtn = document.createElement('button');
    clearFragmentsBtn.id = 'clear-fragments-btn';
    clearFragmentsBtn.textContent = 'Usuń wszystkie fragmenty';
    clearFragmentsBtn.style.marginTop = '8px';
    clearFragmentsBtn.style.display = 'none';
    document.getElementById('memory-buttons').appendChild(clearFragmentsBtn);
    let fragmentMemoryVisible = false;
    btn.onclick = function() {
      fragmentMemoryVisible = !fragmentMemoryVisible;
      fragList.style.display = fragmentMemoryVisible ? 'block' : 'none';
      clearFragmentsBtn.style.display = fragmentMemoryVisible ? 'inline-block' : 'none';
      btn.textContent = fragmentMemoryVisible ? 'Ukryj fragmenty' : 'Pokaż fragmenty jako listę';
      if (fragmentMemoryVisible) {
        renderFragmentMemoryComma();
      }
    };
    clearFragmentsBtn.onclick = function() {
      if (confirm('Czy na pewno chcesz usunąć wszystkie zapamiętane fragmenty?')) {
        setFragmentMemory([]);
        renderFragmentMemoryComma();
      }
    };
  }
    // Obsługa przycisku "Inne opcje" - pokazuje/ukrywa dodatkowe opcje
    let otherOptionsVisible = false;
    document.getElementById('other-options-btn').onclick = function() {
      otherOptionsVisible = !otherOptionsVisible;
      document.getElementById('memory-buttons').style.display = otherOptionsVisible ? 'block' : 'none';
        document.getElementById('lang-select-container').style.display = 'flex';
      document.getElementById('search-container').style.display = otherOptionsVisible ? 'flex' : 'none';
      document.getElementById('search-results').style.display = otherOptionsVisible ? 'block' : 'none';
      this.textContent = otherOptionsVisible ? 'Ukryj opcje' : 'Inne opcje';
    };
      // Przywróć tryb ciemny jeśli był zapisany
      const savedDarkMode = localStorage.getItem('slowkaDarkMode');
      if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        const darkBtn = document.getElementById('toggle-dark-mode-btn');
        if (darkBtn) darkBtn.textContent = 'Tryb dzienny';
      }
      
  // Inicjalizuj pakiety
  initializePackages();
  // Pobierz zestawy z API na starcie
  refreshRemoteSetsList();
      
  // ...usunięto inicjalizację widoczności elementów głosowych...
      
      // Rejestracja Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered successfully:', registration);
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
      }
      
      // Aktywuj Wake Lock
      requestWakeLock();
      
      // Inicjalizacja suwaka tempa
      const slider = document.getElementById('time-multiplier-slider');
      const valueDisplay = document.getElementById('time-multiplier-value');

      if (slider && valueDisplay) {
        // Załaduj zapisaną wartość
        const savedMultiplier = localStorage.getItem('slowkaTimeMultiplier');
        if (savedMultiplier) {
          slider.value = savedMultiplier;
          valueDisplay.textContent = `x${parseFloat(savedMultiplier).toFixed(1)}`;
        }

        // Dodaj listener
        slider.addEventListener('input', function() {
          const multiplier = parseFloat(this.value);
          valueDisplay.textContent = `x${multiplier.toFixed(1)}`;
          localStorage.setItem('slowkaTimeMultiplier', multiplier);
        });
      }
  // ...usunięto ładowanie ustawień języka głosowego...
    });

    // ...usunięto całą logikę głosową...
window.skipWord = skipWord;
window.nextWord = nextWord;
window.restart = restart;
window.searchWord = searchWord;
window.removeMemory = removeMemory;
window.removeFragmentMemory = removeFragmentMemory;
