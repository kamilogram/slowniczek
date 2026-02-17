import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ładuj zmienne środowiskowe z pliku .env
dotenv.config();

// Pobranie ścieżki do katalogu projektu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETS_DIR = path.join(__dirname, 'sets');

// Sprawdzenie zmiennych środowiskowych
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Błąd: Zmienne SUPABASE_URL i SUPABASE_ANON_KEY muszą być ustawione w pliku .env');
  process.exit(1);
}

// Inicjalizacja klienta Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Upewnienie się, że katalog sets/ istnieje
if (!fs.existsSync(SETS_DIR)) {
  fs.mkdirSync(SETS_DIR, { recursive: true });
  console.log(`✓ Utworzono katalog: ${SETS_DIR}`);
}

// Funkcja do czyszczenia nazwy pliku z niedozwolonych znaków
function sanitizeFilename(filename) {
  // Znaki niedozwolone w Windows: < > : " / \ | ? *
  return filename
    .replace(/[<>:"|?*\\/]/g, '_') // Zamień niedozwolone znaki na underscore (dodano /)
    .replace(/^\.+/, '') // Usuń kropki na początku
    .replace(/\.+$/, '') // Usuń kropki na końcu
    .trim();
}

async function downloadAllSets() {
  try {
    console.log('📥 Pobieranie wszystkich pakietów z Supabase...\n');

    // Pobierz wszystkie zestawy
    const { data, error } = await supabase
      .from('word_sets')
      .select('*');

    if (error) {
      console.error('❌ Błąd przy pobieraniu zestawów:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  Brak pakietów w bazie danych.');
      process.exit(0);
    }

    console.log(`Znaleziono ${data.length} pakiet(ów).\n`);

    let successCount = 0;
    let skippedCount = 0;

    // Zapisz każdy zestaw do osobnego pliku JSON
    for (const set of data) {
      try {
        // Oczyść nazwę pliku z niedozwolonych znaków
        const safeName = sanitizeFilename(set.name);
        const filename = `${safeName}.json`;
        const filepath = path.join(SETS_DIR, filename);

        // Przygotuj dane do zapisania
        const setData = {
          name: set.name,
          language: set.language,
          type: set.type,
          words: set.words || [],
          count: set.count || (set.words ? set.words.length : 0),
        };

        // Zapisz plik
        fs.writeFileSync(filepath, JSON.stringify(setData, null, 2));
        
        // Jeśli nazwa została zmieniona, pokaż obie wersje
        if (safeName !== set.name) {
          console.log(`✓ Zapisano: ${filename} ← "${set.name}" (${setData.words.length} słów)`);
        } else {
          console.log(`✓ Zapisano: ${filename} (${setData.words.length} słów)`);
        }
        
        successCount++;
      } catch (fileError) {
        console.error(`✗ Błąd przy zapisywaniu "${set.name}": ${fileError.message}`);
        skippedCount++;
      }
    }

    console.log(`\n✅ Pomyślnie pobrano i zapisano ${successCount}/${data.length} pakiet(ów) w katalogu: ${SETS_DIR}`);
    if (skippedCount > 0) {
      console.log(`⚠️  ${skippedCount} pakiet(ów) pominięto z powodu błędów.`);
    }

  } catch (error) {
    console.error('❌ Nieoczekiwany błąd:', error);
    process.exit(1);
  }
}

// Uruchomienie skryptu
downloadAllSets();
