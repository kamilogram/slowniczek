// GitHub Raw CDN - instant delivery, no cold start
const GITHUB_RAW = 'https://raw.githubusercontent.com/kamilogram/slowniczek/master/sets';

// Hardcoded list of available remote sets from GitHub
// Update this when you add new JSON files to the repo
const AVAILABLE_SETS = [
  { name: 'spanish-101', language: 'Spanish', type: 'word', count: 0 },
  { name: 'french-101', language: 'French', type: 'word', count: 0 },
  { name: 'german-101', language: 'German', type: 'word', count: 0 },
];

async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

export function getSets() {
  // Return hardcoded list of available sets
  // Data is loaded on-demand when user selects a set
  return Promise.resolve({ sets: AVAILABLE_SETS });
}

export function getSet(name) {
  // Fetch JSON directly from GitHub Raw
  return fetchJSON(`${GITHUB_RAW}/${encodeURIComponent(name)}.json`);
}

export function saveSet(name, words, language, type) {
  // Not supported with GitHub-only backend
  // Users can fork repo and add JSON files directly
  console.warn('saveSet not supported - edit sets directly in GitHub repo');
  return Promise.reject(new Error('Edit sets directly in GitHub repo'));
}

export function deleteSet(name) {
  // Not supported with GitHub-only backend
  console.warn('deleteSet not supported - delete JSON files in GitHub repo');
  return Promise.reject(new Error('Delete sets directly in GitHub repo'));
}
