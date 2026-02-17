# Eksport pakietów z localStorage

**Ta dokumentacja jest już przestarzała.**

Zamiast ręcznego eksportu z DevTools, użyj automatycznego skryptu:

## ✅ Użyj tego:

**[AUTO-EXPORT.md](AUTO-EXPORT.md)** - Automatycznie exportuje pakiety z localStorage do `public/sets/`

Wystarczy jedna komenda:
```bash
npm run export-auto
```

## ❌ Usunięte:

- `export-custom-sets.js` - zastąpiony przez `export-custom-sets-auto.js`
- Folder `sets/` - niepotrzebny, pakiety idą bezpośrednio do `public/sets/`
