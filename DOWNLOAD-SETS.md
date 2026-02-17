# Pobieranie Pakietów z Supabase

Ten skrypt pobiera wszystkie pakiety słówek z Supabase i zapisuje je do folderu `sets/`.

## Wymagania

- Node.js (v14+)
- Zainstalowane zależności: `@supabase/supabase-js` i `dotenv`

## Instalacja zależności

Upewnij się, że w `package.json` masz zainstalowane niezbędne pakiety:

```bash
npm install @supabase/supabase-js dotenv
```

## Konfiguracja

1. Skopiuj plik `env.example` do `.env`:
   ```bash
   cp env.example .env
   ```

2. Uzupełnij plik `.env` danymi z Twojego projektu Supabase:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   PORT=3001
   ```

   Klucze znadziesz w panelu Supabase:
   - Wejdź do [Supabase](https://supabase.com)
   - Otwórz swój projekt
   - Settings → API
   - Skopiuj `Project URL` i `anon public`

## Użycie

Uruchom skrypt z głównego katalogu projektu:

```bash
node download-sets.js
```

Skrypt:
- ✓ Pobierze wszystkie pakiety z tabeli `word_sets`
- ✓ Zapisze każdy pakiet w osobnym pliku JSON do **`sets/`**
- ✓ Wyświetli podsumowanie ilości pobanych pakietów

## Rezultat

Wszystkie pakiety będą zapisane w katalogu `sets/` w formacie:
```json
{
  "name": "spanish-101",
  "language": "Spanish",
  "type": "word",
  "words": [
    { "front": "hola", "back": "cześć" },
    { "front": "adiós", "back": "do widzenia" }
  ],
  "count": 2
}
```

Pamiętaj aby skopiować pliki z `sets/` do `public/sets/` aby aplikacja mogła je odczytać!

## Troubleshooting

- **Błąd: "Zmienne SUPABASE_URL i SUPABASE_ANON_KEY muszą być ustawione"**
  - Sprawdź, czy plik `.env` istnieje i ma poprawne wartości

- **Błąd: "Cannot find module"**
  - Uruchom: `npm install`

- **Brak pakietów w bazie**
  - Upewnij się, że masz rekordy w tabeli `word_sets` na Supabase

## Automatyzacja

Możesz dodać skrypt do `package.json`:

```json
"scripts": {
  "download-sets": "node download-sets.js"
}
```

Następnie uruchom:
```bash
npm run download-sets
```
