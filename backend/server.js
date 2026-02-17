// Importowanie niezbędnych bibliotek
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicjalizacja aplikacji Express
const app = express();
app.use(cors()); // Włączenie CORS, aby frontend mógł komunikować się z backendem
app.use(express.json()); // Umożliwia parsowanie ciała żądań w formacie JSON

// Ścieżka do folderu z zestawami
const SETS_FOLDER = path.join(__dirname, '..', 'public', 'sets');

// Upewnij się, że folder istnieje
if (!fs.existsSync(SETS_FOLDER)) {
  fs.mkdirSync(SETS_FOLDER, { recursive: true });
  console.log(`✓ Utworzono folder: ${SETS_FOLDER}`);
}

// Helper do sanitacji nazw plików
const sanitizeName = (name) => {
  return name.replace(/[<>:"|?*\\/]/g, '_').replace(/^\.+|\.+$/g, '').trim();
};

// Endpoint główny - do testowania, czy serwer działa
app.get('/', (req, res) => {
  res.json({ message: "Słówka API is running!" });
});

// Endpoint do pobierania listy wszystkich zestawów
app.get('/api/sets', (req, res) => {
  try {
    const files = fs.readdirSync(SETS_FOLDER);
    const sets = [];

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const filePath = path.join(SETS_FOLDER, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        sets.push({
          name: data.name || file.replace('.json', ''),
          language: data.language || 'Unknown',
          type: data.type || 'word',
          count: data.count || (data.words ? data.words.length : 0),
        });
      }
    });

    res.json({ sets });
  } catch (error) {
    console.error('Błąd przy pobieraniu listy zestawów:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do pobierania konkretnego zestawu po nazwie
app.get('/api/sets/:name', (req, res) => {
  const { name } = req.params;
  try {
    // Spróbuj obie wersje nazwy - oryginalną i sanityzowaną
    const originalPath = path.join(SETS_FOLDER, `${name}.json`);
    const sanitizedName = sanitizeName(name);
    const sanitizedPath = path.join(SETS_FOLDER, `${sanitizedName}.json`);

    let filePath = null;
    if (fs.existsSync(originalPath)) {
      filePath = originalPath;
    } else if (fs.existsSync(sanitizedPath)) {
      filePath = sanitizedPath;
    }

    if (!filePath) {
      return res.status(404).json({ error: 'Zestaw nie został znaleziony' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json(data);
  } catch (error) {
    console.error(`Błąd przy pobieraniu zestawu "${name}":`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do zapisywania lub aktualizowania zestawu
app.post('/api/sets/:name', (req, res) => {
  const { name } = req.params;
  const { words, language, type } = req.body;

  console.log(`Otrzymano żądanie zapisu dla "${name}" z językiem "${language}" i typem "${type}"`);

  // Walidacja danych
  if (!Array.isArray(words) || !language || !type) {
    return res.status(400).json({ error: 'Nieprawidłowe dane. Wymagane są: words (tablica), language i type.' });
  }

  try {
    const sanitizedName = sanitizeName(name);
    const filePath = path.join(SETS_FOLDER, `${sanitizedName}.json`);

    const setData = {
      name,
      language,
      type,
      words,
      count: words.length,
    };

    fs.writeFileSync(filePath, JSON.stringify(setData, null, 2));
    console.log(`✓ Pakiet "${name}" zapisany do ${filePath}`);
    res.status(201).json({ message: 'Zestaw zapisany pomyślnie', count: words.length });
  } catch (error) {
    console.error(`Błąd przy zapisywaniu zestawu "${name}":`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do usuwania zestawu
app.delete('/api/sets/:name', (req, res) => {
  const { name } = req.params;
  try {
    // Spróbuj obie wersje nazwy
    const originalPath = path.join(SETS_FOLDER, `${name}.json`);
    const sanitizedName = sanitizeName(name);
    const sanitizedPath = path.join(SETS_FOLDER, `${sanitizedName}.json`);

    let filePath = null;
    if (fs.existsSync(originalPath)) {
      filePath = originalPath;
    } else if (fs.existsSync(sanitizedPath)) {
      filePath = sanitizedPath;
    }

    if (!filePath) {
      return res.status(404).json({ error: 'Zestaw nie został znaleziony' });
    }

    fs.unlinkSync(filePath);
    console.log(`✓ Pakiet "${name}" usunięty z ${filePath}`);
    res.status(200).json({ message: `Zestaw "${name}" został usunięty.` });
  } catch (error) {
    console.error(`Błąd przy usuwaniu zestawu "${name}":`, error);
    res.status(500).json({ error: error.message });
  }
});


// Uruchomienie serwera
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serwer backendu działa na porcie ${PORT}`);
});
