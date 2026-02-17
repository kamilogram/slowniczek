// Local sets directory - reads from sets folder
const SETS_FOLDER = import.meta.env.BASE_URL + 'sets';

// Cache for loaded sets
let setsCache = [];
let setsCacheLoaded = false;
let setsModules = null;

/**
 * Loads all available sets by scanning the sets folder
 * Uses dynamic import to get all JSON files
 */
async function loadAllSets() {
  if (setsCacheLoaded) {
    return setsCache;
  }

  try {
    // Try to import all JSON files from sets folder dynamically
    if (!setsModules) {
      setsModules = import.meta.glob('/sets/*.json', { eager: true });
    }
    const sets = [];

    for (const [path, module] of Object.entries(setsModules)) {
      const data = module.default;
      if (data && data.name) {
        sets.push({
          name: data.name,
          language: data.language || 'Unknown',
          type: data.type || 'word',
          count: data.count || (data.words ? data.words.length : 0),
        });
      }
    }

    setsCache = sets;
    setsCacheLoaded = true;
    console.log(`✓ Loaded ${sets.length} local word sets`);
    return sets;
  } catch (error) {
    console.warn('Could not load sets from files:', error);
    // Fallback: return empty
    return [];
  }
}

export async function getSets() {
  // Load all available sets from local folder
  const sets = await loadAllSets();
  
  // Dodaj pakiety z localStorage (własne zestawy)
  const customSets = getCustomSets();
  const customSetsMeta = customSets.map(s => ({
    name: s.name,
    language: s.language || 'Unknown',
    type: s.type || 'word',
    count: s.count || (s.words ? s.words.length : 0),
    isCustom: true, // Flaga aby wiedzieć że to pakiet własny
  }));

  return Promise.resolve({ sets: [...sets, ...customSetsMeta] });
}

export async function getSet(name) {
  // Najpierw spróbuj pobrać z localStorage (pakiety własne)
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  if (customSets[name]) {
    return Promise.resolve(customSets[name]);
  }

  // Pobierz ze zmiennych modułów załadowanych statycznie
  if (!setsModules) {
    setsModules = import.meta.glob('/sets/*.json', { eager: true });
  }

  // Szukaj pakietu w załadowanych modułach
  for (const [path, module] of Object.entries(setsModules)) {
    const data = module.default;
    if (data && data.name === name) {
      return Promise.resolve(data);
    }
  }

  console.error(`Set "${name}" not found in loaded modules`);
  throw new Error(`Set "${name}" not found`);
}

export function saveSet(name, words, language, type) {
  // Save custom set to localStorage only
  const setData = {
    name,
    language,
    type,
    words,
    count: words.length,
  };

  // Save to localStorage for persistence
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  customSets[name] = setData;
  localStorage.setItem('slowkaCustomSets', JSON.stringify(customSets));

  console.log(`✓ Pakiet "${name}" zapisany w localStorage`);
  return Promise.resolve({ message: 'Pakiet zapisany pomyślnie w localStorage.' });
}

export function deleteSet(name) {
  // Delete from localStorage
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  if (customSets[name]) {
    delete customSets[name];
    localStorage.setItem('slowkaCustomSets', JSON.stringify(customSets));
    console.log(`✓ Pakiet "${name}" usunięty z localStorage`);
    return Promise.resolve({ message: 'Pakiet usunięty.' });
  }
  return Promise.reject(new Error('Pakiet nie został znaleziony'));
}

/**
 * Pobiera JSON z localStorage (pakiety własne)
 */
function getCustomSets() {
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  return Object.values(customSets);
}
