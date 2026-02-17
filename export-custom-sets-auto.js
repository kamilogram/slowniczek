#!/usr/bin/env node

/**
 * Automatyczny eksport pakietów z localStorage
 * Otwiera aplikację w przeglądarce, pobiera dane z localStorage i zapisuje do pliku
 * 
 * Użycie:
 * npm run export-auto
 * 
 * Lub:
 * node export-custom-sets-auto.js [url] [output-dir]
 * 
 * Przykład:
 * node export-custom-sets-auto.js http://localhost:5173 ./public/sets
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domyślne wartości
const DEFAULT_URL = process.argv[2] || 'http://localhost:5173';
const DEFAULT_OUTPUT_DIR = process.argv[3] || path.join(__dirname, 'public', 'sets');

async function exportCustomSets() {
  let browser;
  try {
    console.log('🚀 Uruchamianie przeglądarki...\n');

    // Uruchom Chromium/Chrome
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log(`📱 Otwieranie strony: ${DEFAULT_URL}`);
    const page = await browser.newPage();
    
    // Ustaw timeout
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Przejdź do aplikacji
    await page.goto(DEFAULT_URL, { waitUntil: 'networkidle2' });
    console.log('✓ Strona załadowana\n');

    // Czekaj aż aplikacja się załaduje (poczekaj na React)
    await page.waitForTimeout(2000);

    // Pobierz dane z localStorage
    console.log('📥 Pobieranie danych z localStorage...');
    const customSets = await page.evaluate(() => {
      const data = localStorage.getItem('slowkaCustomSets');
      return data ? JSON.parse(data) : {};
    });

    const setNames = Object.keys(customSets);
    console.log(`✓ Znaleziono ${setNames.length} pakiet(ów)\n`);

    if (setNames.length === 0) {
      console.warn('⚠️  Brak pakietów w localStorage');
      await browser.close();
      process.exit(0);
    }

    // Upewnij się, że katalog istnieje
    if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
      fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
      console.log(`✓ Utworzono katalog: ${DEFAULT_OUTPUT_DIR}\n`);
    }

    // Zapisz każdy pakiet
    console.log(`💾 Zapisywanie pakietów do: ${DEFAULT_OUTPUT_DIR}\n`);
    let successCount = 0;
    let errorCount = 0;

    for (const name of setNames) {
      try {
        const setData = customSets[name];

        // Walidacja
        if (!setData.name || !setData.words || !Array.isArray(setData.words)) {
          throw new Error('Nieprawidłowa struktura pakietu');
        }

        // Oczyść nazwę
        const sanitizeName = (n) => n.replace(/[<>:"|?*\\/]/g, '_').replace(/^\.+|\.+$/g, '').trim();
        const safeName = sanitizeName(name);
        const filename = `${safeName}.json`;
        const filepath = path.join(DEFAULT_OUTPUT_DIR, filename);

        // Przygotuj dane
        const exportData = {
          name: setData.name,
          language: setData.language || 'Unknown',
          type: setData.type || 'word',
          words: setData.words,
          count: setData.count || setData.words.length,
        };

        // Zapisz plik
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

        if (safeName !== name) {
          console.log(`✓ ${filename} ← "${name}" (${exportData.words.length} słów)`);
        } else {
          console.log(`✓ ${filename} (${exportData.words.length} słów)`);
        }

        successCount++;
      } catch (error) {
        console.error(`✗ "${name}": ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Pomyślnie wyeksportowano ${successCount}/${setNames.length} pakiet(ów)`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} pakiet(ów) pominięto`);
    }

    await browser.close();
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Sprawdź czy Puppeteer jest zainstalowany
try {
  await exportCustomSets();
} catch (error) {
  if (error.message.includes('puppeteer')) {
    console.error('❌ Puppeteer nie jest zainstalowany!');
    console.log('\nInstalacja:');
    console.log('  npm install puppeteer');
    console.log('\nLub dodaj do package.json:');
    console.log('  "devDependencies": { "puppeteer": "^21.0.0" }');
  } else {
    throw error;
  }
}
