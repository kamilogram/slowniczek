# slowniczek

## Konfiguracja Supabase

### 1. Utwórz projekt w Supabase
1. Idź na [supabase.com](https://supabase.com) i zarejestruj się
2. Kliknij "New Project"
3. Wybierz organizację i nazwę projektu
4. Poczekaj na utworzenie (2-3 minuty)

### 2. Skonfiguruj bazę danych
1. W panelu Supabase, idź do **SQL Editor**
2. Wklej zawartość pliku `supabase-schema.sql` i wykonaj
3. Sprawdź w **Table Editor** czy tabela `word_sets` została utworzona

### 3. Pobierz klucze API
1. W panelu Supabase, idź do **Settings** → **API**
2. Skopiuj:
   - **Project URL** (np. `https://xyz.supabase.co`)
   - **anon public** key (długi ciąg znaków)

### 4. Skonfiguruj zmienne środowiskowe
1. Skopiuj `env.example` do `.env`:
```bash
cp env.example .env
```
2. Wypełnij `.env`:
```
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=twoj_anon_key
PORT=3001
```

## Uruchomienie

### Lokalnie:
```bash
npm install
npm start
```

### Na Render (deployment):
1. Połącz repo z Render
2. New → Web Service → wybierz repo
3. Dodaj zmienne środowiskowe w sekcji **Environment**:
   - `SUPABASE_URL` = twój URL z Supabase
   - `SUPABASE_ANON_KEY` = twój klucz anon
4. Deploy

### Frontend (GitHub Pages):
1. W `slowniczek/index.html` zmień `API_BASE` na URL z Render:
```js
const API_BASE = 'https://twoj-serwis.onrender.com';
```
2. Deploy na GitHub Pages

## API Endpointy:
- GET `/api/sets` → lista nazw zestawów `{ names: string[] }`
- GET `/api/sets/:name` → pobierz zestaw `{ name, words }`
- POST `/api/sets/:name` body: `{ words: {hint,answer}[] }` → zapis/aktualizacja
- DELETE `/api/sets/:name` → usuń zestaw

## UI:
Na ekranie startowym:
- pole "Nazwa zestawu"
- przyciski: "Zapisz do API", "Załaduj z API", "Usuń z API", "Odśwież listę"
- lista rozwijana z nazwami zestawów