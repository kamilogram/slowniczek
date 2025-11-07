
import { loadFromStorage, saveToStorage } from './storage.js';
import { getVoices } from './speech.js';

// --- Selektory elementów DOM ---
let elements = {};

// Funkcja do inicjalizacji elementów DOM
function initElements() {
    elements = {
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
        speechRateSlider: document.getElementById('speech-rate-slider'),
        speechRateValue: document.getElementById('speech-rate-value'),
        memoryListEl: document.getElementById('memory-list'),
        packageCategoriesContainer: document.getElementById('package-categories-container'),
        customWordsInput: document.getElementById('custom-words-input'),
        remoteSearchInput: document.getElementById('remote-search'),
        langSelectContainer: document.getElementById('lang-select-container')
    };
}

let eventHandlers = {};

// --- Inicjalizacja UI ---
export function initUI(handlers) {
    // Inicjalizuj elementy DOM
    initElements();
    
    eventHandlers = handlers;
    
    // Listeners na ekranie startowym
    elements.startBtn.addEventListener('click', handlers.onStart);
    document.getElementById('change-packages-btn').addEventListener('click', handlers.onChangePackages);
    document.getElementById('btn-refresh-remote').addEventListener('click', handlers.onRefreshRemote);
    document.getElementById('btn-save-remote').addEventListener('click', handlers.onSaveRemote);
    document.getElementById('btn-delete-remote').addEventListener('click', handlers.onDeleteRemote);
    elements.remoteSearchInput.addEventListener('input', (e) => handlers.onFilterRemote(e.target.value));
    
    // Ustawienie nasłuchiwania na zmiany w checkboxach, delegacja zdarzeń
    if (elements.packageCategoriesContainer) {
        elements.packageCategoriesContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            if (event.target.classList.contains('type-checkbox')) {
                // Obsługa checkboxa typu
                const lang = event.target.dataset.lang;
                const type = event.target.dataset.type;
                const isChecked = event.target.checked;
                
                // Zaznacz/odznacz wszystkie pakiety w tym typie
                const packageCheckboxes = document.querySelectorAll(`input[data-lang="${lang}"][data-type="${type}"]:not(.type-checkbox)`);
                packageCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                
                // Zaktualizuj wygląd nagłówka typu
                updateTypeHeaderState(lang, type, isChecked);
                
                // Opóźnij aktualizację, aby dać czas na zaktualizowanie DOM
                setTimeout(() => {
                    updateTypeCheckboxes();
                }, 10);
                
                // Zapisz stan zaznaczonych pakietów do localStorage
                saveSelectedPackagesToStorage();
            } else {
                // Obsługa checkboxa pakietu - aktualizuj stan checkboxa typu
                const lang = event.target.dataset.lang;
                const type = event.target.dataset.type;
                if (lang && type) {
                    // Opóźnij aktualizację, aby dać czas na zaktualizowanie DOM
                    setTimeout(() => {
                        updateTypeCheckboxes();
                    }, 10);
                }
                
                // Zapisz stan zaznaczonych pakietów do localStorage
                saveSelectedPackagesToStorage();
            }
            handlers.onSelectionChange();
        }
    });
    }

    // Obsługa kliknięć w nagłówki kategorii i typów
    if (elements.packageCategoriesContainer) {
        elements.packageCategoriesContainer.addEventListener('click', (event) => {
        // Sprawdź czy kliknięto na checkbox - jeśli tak, nie rozwijaj/zwijaj
        if (event.target.type === 'checkbox' && event.target.classList.contains('type-checkbox')) {
            return; // Nie rób nic więcej - checkbox obsłuży się sam
        }
        
        if (event.target.closest('.category-toggle')) {
            const button = event.target.closest('.category-toggle');
            const lang = button.dataset.lang;
            toggleCategory(lang);
        } else if (event.target.closest('.type-toggle')) {
            const button = event.target.closest('.type-toggle');
            const lang = button.dataset.lang;
            const type = button.dataset.type;
            toggleType(lang, type);
        }
    });
    }
    
    // Listeners w głównej aplikacji
    document.getElementById('skip-word-btn').addEventListener('click', handlers.onSkip);
    document.getElementById('next-word-btn').addEventListener('click', handlers.onNext);
    document.getElementById('restart-btn').addEventListener('click', handlers.onRestart);
    document.getElementById('undo-known-btn').addEventListener('click', handlers.onUndo);
    
    const autoModeBtn = document.getElementById('auto-mode-btn');
    // Ustaw początkowy stan przycisku auto na podstawie localStorage
    try {
        const savedAuto = loadFromStorage('slowkaAutoMode') === 'true';
        if (autoModeBtn) {
            if (savedAuto) {
                autoModeBtn.classList.add('active');
            } else {
                autoModeBtn.classList.remove('active');
            }
        }
        // Apply full auto UI state (hide/show buttons and panels)
        setAutoModeUI(savedAuto);
    } catch (e) {
        // Jeśli dostęp do storage rzuci błędem, nie blokujemy inicjalizacji
        console.warn('Nie udało się odczytać ustawienia auto mode z localStorage', e);
    }

    if (autoModeBtn) {
        autoModeBtn.addEventListener('click', () => {
            const isAuto = autoModeBtn.classList.toggle('active');
            setAutoModeUI(isAuto);
            handlers.onAutoModeToggle();
        });
    }
    
    elements.timeMultiplierSlider.addEventListener('input', (e) => {
        elements.timeMultiplierValue.textContent = `x${parseFloat(e.target.value).toFixed(1)}`;
    });
    elements.timeMultiplierSlider.addEventListener('change', (e) => {
        saveToStorage('slowkaTimeMultiplier', e.target.value);
    });

    if (elements.speechRateSlider) {
        elements.speechRateSlider.addEventListener('input', (e) => {
            elements.speechRateValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
        elements.speechRateSlider.addEventListener('change', (e) => {
            saveToStorage('slowkaSpeechRate', e.target.value);
        });
        // Load saved speech rate
        elements.speechRateSlider.value = loadFromStorage('slowkaSpeechRate') || 1.0;
        elements.speechRateValue.textContent = parseFloat(elements.speechRateSlider.value).toFixed(1);
    }
    
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
    if (toggleDarkModeBtn) {
        // Ustaw początkowy stan przycisku
        const savedDarkMode = loadFromStorage('slowkaDarkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            toggleDarkModeBtn.textContent = 'Tryb dzienny';
        }

        toggleDarkModeBtn.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            toggleDarkModeBtn.textContent = isDarkMode ? 'Tryb dzienny' : 'Tryb nocny';
            saveToStorage('slowkaDarkMode', isDarkMode);
        });
    }

    // Voices
    const showVoicesBtn = document.getElementById('show-voices-btn');
    showVoicesBtn.addEventListener('click', toggleVoicesList);

    // Wczytanie zapisanych ustawień
    elements.timeMultiplierSlider.value = loadFromStorage('slowkaTimeMultiplier') || 1.0;
    elements.timeMultiplierValue.textContent = `x${parseFloat(elements.timeMultiplierSlider.value).toFixed(1)}`;
}

// Toggle UI elements for auto mode (hide navigation buttons, show sliders)
export function setAutoModeUI(isAuto) {
    // Ensure elements are initialized
    if (!elements || Object.keys(elements).length === 0) initElements();
    const skipBtn = document.getElementById('skip-word-btn');
    const nextBtn = document.getElementById('next-word-btn');
    const undoBtn = document.getElementById('undo-known-btn');
    const autoModeBtn = document.getElementById('auto-mode-btn');

    if (skipBtn) skipBtn.style.display = isAuto ? 'none' : '';
    if (nextBtn) nextBtn.style.display = isAuto ? 'none' : '';
    if (undoBtn) undoBtn.style.display = isAuto ? 'none' : '';

    if (elements.autoModeSettings) elements.autoModeSettings.style.display = isAuto ? 'flex' : 'none';
    if (elements.langSelectContainer) elements.langSelectContainer.style.display = isAuto ? 'flex' : 'none';

    // Update auto button label
    if (autoModeBtn) {
        autoModeBtn.textContent = isAuto ? 'Wyłącz auto' : 'Auto tryb';
        if (isAuto) autoModeBtn.classList.add('active'); else autoModeBtn.classList.remove('active');
    }
}

// Funkcja pomocnicza do czekania na dostępność elementu
function waitForElement(selector, timeout = 1000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// --- Renderowanie dynamicznej listy pakietów ---
export function renderAllPackages(localPackages, remoteSets, apiError = false) {
    if (!elements.packageCategoriesContainer) {
        console.error('Package categories container not found');
        return;
    }
    
    elements.packageCategoriesContainer.innerHTML = ''; // Wyczyść kontener

    const allPackages = [
        ...localPackages.map(p => ({ ...p, isLocal: true })),
        ...remoteSets.map(p => ({ ...p, isLocal: false }))
    ];

    // Mapowanie kategorii językowych
    const languageMapping = {
        'en': 'Angielski',
        'es': 'Hiszpański',
        'it': 'Włoski',
        'fr': 'Francuski'
    };

    // Mapowanie flag krajów z alternatywnymi opcjami
    const flagMapping = {
        'Polski': '🇵🇱',
        'Angielski': '🇬🇧', 
        'Hiszpański': '🇪🇸',
        'Włoski': '🇮🇹',
        'Francuski': '🇫🇷',
        'Nieokreślony': '❓'
    };
    
    // Alternatywne flagi dla systemów, które nie obsługują emoji flag
    const altFlagMapping = {
        'Polski': 'PL',
        'Angielski': 'GB',
        'Hiszpański': 'ES',
        'Włoski': 'IT',
        'Francuski': 'FR',
        'Nieokreślony': '?'
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
        
        // Nagłówek kategorii językowej z flagą i przyciskiem rozwijania
        const langHeader = document.createElement('div');
        langHeader.className = 'category-header';
        // Sprawdź czy przeglądarka obsługuje emoji flagi
        const testFlag = '🇵🇱';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '16px Arial';
        const emojiWidth = ctx.measureText(testFlag).width;
        const regularWidth = ctx.measureText('PL').width;
        
        // Jeśli emoji flagi są szersze niż zwykły tekst, prawdopodobnie są obsługiwane
        const supportsEmojiFlags = emojiWidth > regularWidth * 1.5;
        
        const flag = supportsEmojiFlags ? (flagMapping[lang] || '❓') : (altFlagMapping[lang] || '?');
        
        langHeader.innerHTML = `
            <button class="category-toggle" data-lang="${lang}">
                <span class="toggle-icon">▼</span>
                <span class="flag">${flag}</span>
                <span class="category-title">${lang}</span>
            </button>
        `;
        categoryDiv.appendChild(langHeader);

        const langContent = document.createElement('div');
        langContent.className = 'category-content';
        langContent.style.display = loadFromStorage(`category-${lang}-expanded`) === 'true' ? 'block' : 'none';

        const sortedTypes = Object.keys(grouped[lang]).sort();
        for (const type of sortedTypes) {
            const typeDiv = document.createElement('div');
            typeDiv.className = 'type-section';
            
            // Nagłówek typu z checkboxem
            const typeHeader = document.createElement('div');
            typeHeader.className = 'type-header';
            const typeDisplayName = type === 'word' ? 'Słówka' : type === 'sentence' ? 'Zdania' : type;
            
            typeHeader.innerHTML = `
                <button class="type-toggle" data-lang="${lang}" data-type="${type}">
                    <span class="toggle-icon">▼</span>
                    <input type="checkbox" class="type-checkbox" data-lang="${lang}" data-type="${type}">
                    <span class="type-title">${typeDisplayName}</span>
                </button>
            `;
            typeDiv.appendChild(typeHeader);

            const typeContent = document.createElement('div');
            typeContent.className = 'type-content';
            typeContent.style.display = loadFromStorage(`type-${lang}-${type}-expanded`) === 'true' ? 'block' : 'none';
            
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
                               data-set-name="${pkg.isLocal ? '' : pkg.name}"
                               data-lang="${lang}"
                               data-type="${type}">
                        <span class="package-name">${name}</span>
                        <span class="package-count">${count || '...'}</span>
                    </label>
                `;
            });
            
            typeContent.appendChild(packageListDiv);
            typeDiv.appendChild(typeContent);
            langContent.appendChild(typeDiv);
        }
        
        categoryDiv.appendChild(langContent);
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
    
    // Aktualizuj stan checkboxów typu po renderowaniu
    setTimeout(() => {
        updateTypeCheckboxes();
    }, 100);
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
        // Make the bolded answer also appear green
        lastWordText = `Poprzednie: <b class="last-word-green">${previous.answer}</b> - <i>${previous.hint}</i>`;
    }
    elements.lastWordEl.innerHTML = lastWordText;

    // Update next button label depending on whether the answer is visible
    const nextBtn = document.getElementById('next-word-btn');
    if (nextBtn) {
        nextBtn.textContent = showAnswer ? 'Dalej' : 'Wiem';
    }
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

// Funkcje pomocnicze dla rozwijania/zwijania kategorii
function toggleCategory(lang) {
    const button = document.querySelector(`.category-toggle[data-lang="${lang}"]`);
    if (!button) return;
    
    const categoryDiv = button.closest('.category');
    const content = categoryDiv.querySelector('.category-content');
    const icon = button.querySelector('.toggle-icon');
    
    if (!content || !icon) return;
    
    const isExpanded = content.style.display === 'block';
    content.style.display = isExpanded ? 'none' : 'block';
    icon.textContent = isExpanded ? '▶' : '▼';
    
    // Zapisz stan
    saveToStorage(`category-${lang}-expanded`, !isExpanded);
}

function toggleType(lang, type) {
    const button = document.querySelector(`.type-toggle[data-lang="${lang}"][data-type="${type}"]`);
    if (!button) return;
    
    const typeSection = button.closest('.type-section');
    const content = typeSection.querySelector('.type-content');
    const icon = button.querySelector('.toggle-icon');
    
    if (!content || !icon) return;
    
    const isExpanded = content.style.display === 'block';
    content.style.display = isExpanded ? 'none' : 'block';
    icon.textContent = isExpanded ? '▶' : '▼';
    
    // Zapisz stan
    saveToStorage(`type-${lang}-${type}-expanded`, !isExpanded);
}

function updateTypeHeaderState(lang, type, hasSelected) {
    const typeHeader = document.querySelector(`.type-toggle[data-lang="${lang}"][data-type="${type}"]`);
    if (typeHeader) {
        if (hasSelected) {
            typeHeader.classList.add('has-selected');
        } else {
            typeHeader.classList.remove('has-selected');
        }
    }
}

function updateLanguageHeaderState(lang, hasSelected) {
    const langHeader = document.querySelector(`.category-toggle[data-lang="${lang}"]`);
    if (langHeader) {
        if (hasSelected) {
            langHeader.classList.add('has-selected');
        } else {
            langHeader.classList.remove('has-selected');
        }
    }
}

// Funkcja do zapisywania zaznaczonych pakietów do localStorage
function saveSelectedPackagesToStorage() {
    const selectedPackages = Array.from(document.querySelectorAll('#start-screen input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.id);
    saveToStorage('slowkaSelectedPackages', selectedPackages);
}

// Funkcja do aktualizacji stanu checkboxów typu na podstawie zaznaczonych pakietów
function updateTypeCheckboxes() {
    const typeCheckboxes = document.querySelectorAll('.type-checkbox');
    const languageStates = {}; // Śledź stan każdego języka
    
    typeCheckboxes.forEach(checkbox => {
        const lang = checkbox.dataset.lang;
        const type = checkbox.dataset.type;
        
        const packageCheckboxes = document.querySelectorAll(`input[data-lang="${lang}"][data-type="${type}"]:not(.type-checkbox)`);
        const checkedPackages = document.querySelectorAll(`input[data-lang="${lang}"][data-type="${type}"]:not(.type-checkbox):checked`);
        
        if (checkedPackages.length === 0) {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        } else if (checkedPackages.length === packageCheckboxes.length) {
            checkbox.checked = true;
            checkbox.indeterminate = false;
        } else {
            checkbox.checked = false;
            checkbox.indeterminate = true;
        }
        
        updateTypeHeaderState(lang, type, checkedPackages.length > 0);
        
        // Śledź stan języka - inicjalizuj jako false
        if (!languageStates.hasOwnProperty(lang)) {
            languageStates[lang] = false;
        }
        // Ustaw na true tylko jeśli są zaznaczone pakiety w tym typie
        if (checkedPackages.length > 0) {
            languageStates[lang] = true;
        }
    });
    
    // Sprawdź czy wszystkie typy w języku są odznaczone
    const allLanguages = new Set(Array.from(typeCheckboxes).map(cb => cb.dataset.lang));
    allLanguages.forEach(lang => {
        const allPackagesInLang = document.querySelectorAll(`input[data-lang="${lang}"]:not(.type-checkbox)`);
        const checkedPackagesInLang = document.querySelectorAll(`input[data-lang="${lang}"]:not(.type-checkbox):checked`);
        
        // Jeśli nie ma zaznaczonych pakietów w całym języku, ustaw stan na false
        if (checkedPackagesInLang.length === 0) {
            languageStates[lang] = false;
        }
    });
    
    // Aktualizuj stan nagłówków języków
    Object.keys(languageStates).forEach(lang => {
        updateLanguageHeaderState(lang, languageStates[lang]);
    });
}
