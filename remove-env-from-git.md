# Instrukcja usunięcia .env z repozytorium Git

## Krok 1: Usuń .env z cache Git (lokalnie)
```bash
git rm --cached .env
```

## Krok 2: Commit zmian
```bash
git commit -m "Remove .env from repository"
```

## Krok 3: Usuń .env z historii Git (wszystkie branche)
```bash
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
```

Lub użyj nowszego narzędzia git-filter-repo (zalecane):
```bash
# Najpierw zainstaluj: pip install git-filter-repo
git filter-repo --path .env --invert-paths --force
```

## Krok 4: Wymuś push do wszystkich branchy
```bash
git push origin --force --all
git push origin --force --tags
```

## Krok 5: Zmień klucze API
Ponieważ .env był w historii Git, musisz zmienić:
- SUPABASE_ANON_KEY w Supabase Dashboard
- VITE_GROQ_API_KEY w Groq Console

## Krok 6: Upewnij się że .env jest w .gitignore
Sprawdź czy .gitignore zawiera:
```
.env
.env.local
```

## Krok 7: Poinformuj współpracowników
Jeśli ktoś ma sklonowane repo, musi wykonać:
```bash
git fetch origin
git reset --hard origin/main
git reset --hard origin/gh-pages
```

## Uwaga dla gh-pages
Jeśli używasz GitHub Actions do deploymentu na gh-pages:
1. Dodaj secrets w GitHub repo settings
2. Użyj ich w workflow zamiast pliku .env
