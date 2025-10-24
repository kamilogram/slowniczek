// Importowanie niezbędnych bibliotek
require('dotenv').config(); // Ładuje zmienne środowiskowe z pliku .env
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Inicjalizacja aplikacji Express
const app = express();
app.use(cors()); // Włączenie CORS, aby frontend mógł komunikować się z backendem
app.use(express.json()); // Umożliwia parsowanie ciała żądań w formacie JSON

// Sprawdzenie, czy klucze API do Supabase są dostępne
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Błąd: Zmienne środowiskowe SUPABASE_URL i SUPABASE_ANON_KEY muszą być ustawione.');
  process.exit(1); // Zakończ proces, jeśli brakuje kluczy
}

// Inicjalizacja klienta Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Endpoint główny - do testowania, czy serwer działa
app.get('/', (req, res) => {
  res.json({ message: "Słówka API is running!" });
});

// Endpoint do pobierania listy wszystkich zestawów
app.get('/api/sets', async (req, res) => {
  try {
    // Pobieramy tylko potrzebne dane, aby zmniejszyć transfer
    const { data, error } = await supabase
      .from('word_sets')
      .select('name, language, type')
    if (error) throw error;
    res.json({ sets: data || [] });
  } catch (error) {
    console.error('Błąd przy pobieraniu listy zestawów:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do pobierania konkretnego zestawu po nazwie
app.get('/api/sets/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const { data, error } = await supabase
      .from('word_sets')
      .select('words')
      .eq('name', name)
      .single(); // .single() zwraca jeden obiekt zamiast tablicy

    if (error) {
        // Jeśli zestaw nie istnieje, Supabase zwróci błąd, ale my chcemy 404
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Zestaw nie został znaleziony' });
        }
        throw error;
    }
    res.json({ words: data ? data.words : [] });
  } catch (error) {
    console.error(`Błąd przy pobieraniu zestawu "${name}":`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do zapisywania lub aktualizowania zestawu
app.post('/api/sets/:name', async (req, res) => {
  const { name } = req.params;
  const { words, language, type } = req.body;

  console.log(`Otrzymano żądanie zapisu dla "${name}" z językiem "${language}" i typem "${type}"`);

  // Walidacja danych
  if (!Array.isArray(words) || !language || !type) {
    return res.status(400).json({ error: 'Nieprawidłowe dane. Wymagane są: words (tablica), language i type.' });
  }

  try {
    const { data, error } = await supabase
      .from('word_sets')
      .upsert({ 
          name, 
          words, 
          count: words.length,
          language,
          type
      }, {
          onConflict: 'name' // To jest kluczowe! Mówi Supabase, aby aktualizować wiersz, jeśli nazwa już istnieje.
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Zestaw zapisany pomyślnie', count: words.length });
  } catch (error) {
    console.error(`Błąd przy zapisywaniu zestawu "${name}":`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint do usuwania zestawu
app.delete('/api/sets/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const { error } = await supabase
      .from('word_sets')
      .delete()
      .eq('name', name);

    if (error) throw error;
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
