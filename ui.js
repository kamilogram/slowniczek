
import { loadFromStorage, saveToStorage } from './storage.js';
import { getVoices } from './speech.js';

// --- Selektory elementów DOM ---
const elements = {
    startScreen: document.getElementById('start-screen'),
    mainApp: document.getElementById('main-app'),
    startBtn: document.getElementById('start-btn'),
    selectedInfo: document.getElementById('selected-info'),
    hintEl: document.getElementById('hint'),
    answerEl: document.getElementById('answer'),
    progressEl: document.getElementById('progress'),
    lastWordEl: document.getElementById('last-word'),
    autoTimerEl: document.getElementById('auto-timer'),
    autoModeSettings: document.getElementById('auto-mode-settings'),
    timeMultiplierSlider: document.getElementById('time-multiplier-slider'),
    timeMultiplierValue: document.getElementById('time-multiplier-value'),
    memoryListEl: document.getElementById('memory-list'),
    packageCategoriesContainer: document.getElementById('package-categories-container'),
    customWordsInput: document.getElementById('custom-words-input'),
    remoteSearchInput: document.getElementById('remote-search'),
    langSelectContainer: document.getElementById('lang-select-container')
};

let eventHandlers = {};

// --- Inicjalizacja UI ---
export function initUI(handlers) {
    eventHandlers = handlers;
    
    // Listeners na ekranie startowym
    elements.startBtn.addEventListener('click', handlers.onStart);
    document.getElementById('change-packages-btn').addEventListener('click', handlers.onChangePackages);
    document.getElementById('btn-refresh-remote').addEventListener('click', handlers.onRefreshRemote);
    document.getElementById('btn-save-remote').addEventListener('click', handlers.onSaveRemote);
    document.getElementById('btn-delete-remote').addEventListener('click', handlers.onDeleteRemote);
    elements.remoteSearchInput.addEventListener('input', (e) => handlers.onFilterRemote(e.target.value));
    
    // Ustawienie nasłuchiwania na zmiany w checkboxach, delegacja zdarzeń
    elements.packageCategoriesContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            handlers.onSelectionChange();
        }
    });
    
    // Listeners w głównej aplikacji
    document.getElementById('skip-word-btn').addEventListener('click', handlers.onSkip);
    document.getElementById('next-word-btn').addEventListener('click', handlers.onNext);
    document.getElementById('restart-btn').addEventListener('click', handlers.onRestart);
    document.getElementById('undo-known-btn').addEventListener('click', handlers.onUndo);
    
    const autoModeBtn = document.getElementById('auto-mode-btn');
    autoModeBtn.addEventListener('click', () => {
        const isAuto = autoModeBtn.classList.toggle('active');
        elements.autoModeSettings.style.display = isAuto ? 'flex' : 'none';
        elements.langSelectContainer.style.display = isAuto ? 'flex' : 'none';
        handlers.onAutoModeToggle();
    });
    
    elements.timeMultiplierSlider.addEventListener('input', (e) => {
        elements.timeMultiplierValue.textContent = `x${parseFloat(e.target.value).toFixed(1)}`;
    });
    elements.timeMultiplierSlider.addEventListener('change', (e) => {
        saveToStorage('slowkaTimeMultiplier', e.target.value);
    });
    
    // Inne opcje i zapamiętywanie
    document.getElementById('other-options-btn').addEventListener('click', () => {
        const memButtons = document.getElementById('memory-buttons');
        memButtons.style.display = memButtons.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('save-current-btn').addEventListener('click', handlers.onSaveCurrent);
    document.getElementById('save-word-btn').addEventListener('click', handlers.onSavePrevious);
    document.getElementById('show-memory-btn').addEventListener('click', toggleMemoryList);
    document.getElementById('clear-used-btn').addEventListener('click', handlers.onClearUsed);

    // Dark Mode
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode-btn');
    toggleDarkModeBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        toggleDarkModeBtn.textContent = isDarkMode ? 'Tryb dzienny' : 'Tryb nocny';
        saveToStorage('slowkaDarkMode', isDarkMode);
    });

    // Voices
    const showVoicesBtn = document.getElementById('show-voices-btn');
    showVoicesBtn.addEventListener('click', toggleVoicesList);

    // Wczytanie zapisanych ustawień
    elements.timeMultiplierSlider.value = loadFromStorage('slowkaTimeMultiplier') || 1.0;
    elements.timeMultiplierValue.textContent = `x${parseFloat(elements.timeMultiplierSlider.value).toFixed(1)}`;
}

// --- Renderowanie dynamicznej listy pakietów ---
export function renderAllPackages(localPackages, remoteSets, apiError = false) {
    elements.packageCategoriesContainer.innerHTML = ''; // Wyczyść kontener

    const allPackages = [
        ...localPackages.map(p => ({ ...p, isLocal: true })),
        ...remoteSets.map(p => ({ ...p, isLocal: false }))
    ];

    // Mapowanie kategorii językowych
    const languageMapping = {
        'en': 'Angielski',
        'es': 'Hiszpański'
    };

    const grouped = allPackages.reduce((acc, pkg) => {
        const originalLang = pkg.language || 'Nieokreślony';
        const lang = languageMapping[originalLang] || originalLang;
        const type = pkg.type || 'Nieokreślony typ';
        if (!acc[lang]) acc[lang] = {};
        if (!acc[lang][type]) acc[lang][type] = [];
        acc[lang][type].push(pkg);
        return acc;
    }, {});

    const sortedLanguages = Object.keys(grouped).sort();

    for (const lang of sortedLanguages) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.innerHTML += `<h4>${lang}</h4>`;

        const sortedTypes = Object.keys(grouped[lang]).sort();
        for (const type of sortedTypes) {
            categoryDiv.innerHTML += `<h5>${type === 'word' ? 'Słówka' : type === 'sentence' ? 'Zdania' : type}</h5>`;
            
            const packageListDiv = document.createElement('div');
            packageListDiv.className = 'package-list';
            
            grouped[lang][type].forEach(pkg => {
                const id = pkg.isLocal ? pkg.id : `remote-${pkg.name}`;
                const name = pkg.isLocal ? pkg.name : pkg.name;
                const count = pkg.data ? pkg.data.length : pkg.count;

                packageListDiv.innerHTML += `
                    <label class="package-item" for="${id}">
                        <input type="checkbox" id="${id}" 
                               data-package-type="${pkg.isLocal ? 'local' : 'remote'}" 
                               data-set-name="${pkg.isLocal ? '' : pkg.name}">
                        <span class="package-name">${name}</span>
                        <span class="package-count">${count || '...'}</span>
                    </label>
                `;
            });
            categoryDiv.appendChild(packageListDiv);
        }
        elements.packageCategoriesContainer.appendChild(categoryDiv);
    }
     // Sprawdź zapisane checkboxy
    const savedPackages = loadFromStorage('slowkaSelectedPackages');
    if (savedPackages && Array.isArray(savedPackages)) {
        savedPackages.forEach(pkgId => {
            const checkbox = document.getElementById(pkgId);
            if (checkbox) checkbox.checked = true;
        });
    }

    if (apiError) {
        elements.packageCategoriesContainer.innerHTML += `<p style="color:red;text-align:center;">Błąd ładowania zestawów z API. Spróbuj odświeżyć.</p>`;
    }
}


// --- Aktualizacje UI ---
export function updateStartButton(localPackages, remoteSets) {
    const customWords = (elements.customWordsInput.value || '').trim();
    const checkedBoxes = document.querySelectorAll('#start-screen input[type="checkbox"]:checked').length;
    
    const totalSelected = checkedBoxes + (customWords ? 1 : 0);

    if (totalSelected > 0) {
        elements.startBtn.disabled = false;
        elements.selectedInfo.textContent = `Wybrano ${totalSelected} pakiet(ów).`;
    } else {
        elements.startBtn.disabled = true;
        elements.selectedInfo.textContent = 'Wybierz co najmniej jeden pakiet';
    }
}

export function showPackageSelectionScreen() {
    elements.startScreen.style.display = 'flex';
    elements.mainApp.style.display = 'none';
}

export function showMainAppScreen() {
    elements.startScreen.style.display = 'none';
    elements.mainApp.style.display = 'block';
}

export function displayWord(current, showAnswer, previous, message = null) {
    const restartBtn = document.getElementById('restart-btn');
    if (!current) {
        elements.hintEl.textContent = 'Gratulacje! Wszystkie słówka odgadnięte.';
        elements.answerEl.textContent = '';
        elements.answerEl.style.visibility = 'hidden';
        restartBtn.style.display = 'inline-block';
        return;
    }
    
    restartBtn.style.display = 'none';
    elements.hintEl.textContent = current.hint;
    elements.answerEl.textContent = current.answer;
    
    elements.answerEl.style.visibility = showAnswer ? 'visible' : 'hidden';

    let lastWordText = '';
    if (message) {
        lastWordText = message;
    } else if (previous) {
        lastWordText = `Poprzednie: <b>${previous.answer}</b> - <i>${previous.hint}</i>`;
    }
    elements.lastWordEl.innerHTML = lastWordText;
}

export function updateProgressUI(usedCount, totalCount) {
    elements.progressEl.textContent = `${usedCount} / ${totalCount}`;
}

export function renderMemoryList(memoryArray) {
    elements.memoryListEl.innerHTML = '';
    if (memoryArray.length === 0) {
        elements.memoryListEl.innerHTML = '<p>Brak zapamiętanych słówek.</p>';
        return;
    }
    memoryArray.forEach((word, index) => {
        const item = document.createElement('div');
        item.className = 'memory-item';
        item.innerHTML = `
            <div class="memory-item-content">
                <b>${word.answer}</b>
                <span>${word.hint}</span>
            </div>
            <button data-index="${index}">Usuń</button>
        `;
        item.querySelector('button').addEventListener('click', () => {
            const updatedMemory = memoryArray.filter((_, i) => i !== index);
            saveToStorage('slowkaMemory', updatedMemory);
            renderMemoryList(updatedMemory);
        });
        elements.memoryListEl.appendChild(item);
    });
}

function toggleMemoryList() {
    const display = elements.memoryListEl.style.display;
    if (display === 'none') {
        const memory = loadFromStorage('slowkaMemory') || [];
        renderMemoryList(memory);
        elements.memoryListEl.style.display = 'block';
    } else {
        elements.memoryListEl.style.display = 'none';
    }
}

export function clearUsedWordsUI() {
    elements.lastWordEl.innerHTML = "Historia wyczyszczona. Zaczynasz od nowa.";
    updateProgressUI(0, 0); 
}

async function toggleVoicesList() {
    const voicesListEl = document.getElementById('voices-list');
    const showVoicesBtn = document.getElementById('show-voices-btn');
    const isVisible = voicesListEl.style.display === 'block';

    if (isVisible) {
        voicesListEl.style.display = 'none';
        showVoicesBtn.textContent = 'Pokaż dostępne głosy';
    } else {
        showVoicesBtn.textContent = 'Wczytywanie głosów...';
        try {
            const voices = await getVoices();
            voicesListEl.innerHTML = voices.map(v => `<div>${v.name} (${v.lang})</div>`).join('');
            voicesListEl.style.display = 'block';
            showVoicesBtn.textContent = 'Ukryj dostępne głosy';
        } catch (error) {
            voicesListEl.innerHTML = 'Nie udało się załadować głosów.';
            console.error('Error fetching voices:', error);
            showVoicesBtn.textContent = 'Spróbuj ponownie';
        }
    }
}
