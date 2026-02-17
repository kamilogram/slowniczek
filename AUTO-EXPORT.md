# Automatyczny Export Pakietów - Jeden Skript

Nowy skrypt automatycznie pobiera pakiety z localStorage bez konieczności ręcznego exportu z konsoli.

## Instalacja (jeden raz)

Otwórz **Command Prompt (cmd.exe)** i uruchom:

```cmd
cd C:\Users\glins\Documents\Programowanie\slowka
npm install puppeteer
```

Czekaj aż się zainstaluje (~30 sekund, pobiera ~200MB).

## Użycie

### Opcja 1: Automatycznie (POLECAM) ✨

```cmd
npm run export-auto
```

To wszystko! Skrypt:
- ✓ Otworzy przeglądarkę
- ✓ Załaduje aplikację z localhost:5173
- ✓ Pobierze dane z localStorage
- ✓ Zapisze pakiety do `public/sets/`
- ✓ Zamknie przeglądarkę

### Opcja 2: Ręczny export (jeśli chcesz)

```cmd
npm run export-auto:custom custom-sets.json
```

## Wymagania

- Aplikacja musi działać na `http://localhost:5173`
  ```cmd
  npm run dev
  ```
  (w osobnym oknie terminala)

- Pakiety muszą być w `localStorage` (dodane w aplikacji)

## Przykład pełnego workflow

Terminal 1 - uruchom aplikację:
```cmd
npm run dev
```

Terminal 2 - wyeksportuj pakiety:
```cmd
npm run export-auto
```

Output:
```
🚀 Uruchamianie przeglądarki...

📱 Otwieranie strony: http://localhost:5173
✓ Strona załadowana

📥 Pobieranie danych z localStorage...
✓ Znaleziono 5 pakiet(ów)

💾 Zapisywanie pakietów do: C:\...\public\sets

✓ pakiet-1.json (50 słów)
✓ pakiet-2.json (75 słów)
✓ test.json (10 słów)
✓ moj-pakiet.json (30 słów)
✓ angielski.json (100 słów)

✅ Pomyślnie wyeksportowano 5/5 pakiet(ów)
```

## Opcje zaawansowane

Wyeksportuj do innego folderu:
```cmd
node export-custom-sets-auto.js http://localhost:5173 C:\moja\sciezka
```

## Troubleshooting

### "Puppeteer nie jest zainstalowany"
```cmd
npm install puppeteer
```

### "Brak pakietów w localStorage"
- Dodaj pakiety w aplikacji przed uruchomieniem eksportu

### "Nie mogę połączyć się z localhost:5173"
- Upewnij się że `npm run dev` działa w innym oknie terminala

### "Timeout - strona się nie ładuje"
- Sprawdź czy aplikacja działa prawidłowo
- Wróć do `http://localhost:5173` w przeglądarce i sprawdź
