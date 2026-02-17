/**
 * Utility do eksportu pakietów z localStorage
 * Uruchom w DevTools Console: copy(exportCustomSetsForClipboard())
 */

export function exportCustomSetsForClipboard() {
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  return JSON.stringify(customSets, null, 2);
}

export function getCustomSetsCount() {
  const customSets = JSON.parse(localStorage.getItem('slowkaCustomSets') || '{}');
  return Object.keys(customSets).length;
}

/**
 * Funkcja do wywołania z przeglądarki - wyświetla instrukcje
 */
export function showExportInstructions() {
  console.log('📋 Instrukcja eksportu pakietów z localStorage:\n');
  console.log('1. Skopiuj poniższy JSON do schowka:');
  console.log('   copy(JSON.stringify(JSON.parse(localStorage.getItem("slowkaCustomSets") || "{}"), null, 2))\n');
  console.log('2. Stwórz plik "custom-sets.json" w głównym folderze projektu');
  console.log('3. Wklej zawartość i zapisz plik');
  console.log('4. Uruchom w terminalu: node export-custom-sets.js custom-sets.json\n');
  
  const count = getCustomSetsCount();
  console.log(`Masz ${count} pakiet(ów) do eksportu`);
}
