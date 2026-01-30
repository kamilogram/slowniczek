# Adding New Word Sets to Słówka

Remote word sets for the app are hosted as JSON files in this repository under `/sets/` directory.

## Structure

Each set must be a JSON file named `{set-name}.json` with this structure:

```json
{
  "name": "spanish-101",
  "language": "Spanish",
  "type": "word",
  "words": [
    { "front": "hola", "back": "cześć" },
    { "front": "adiós", "back": "do widzenia" }
  ]
}
```

## Adding a New Set

1. **Create JSON file** in `/sets/` folder (e.g., `italian-101.json`)
2. **Register in frontend** - update `AVAILABLE_SETS` in `src/services/api.js`:
   ```javascript
   const AVAILABLE_SETS = [
     { name: 'italian-101', language: 'Italian', type: 'word', count: 10 },
     // ... other sets
   ];
   ```
3. **Commit and push** - file is instantly available via GitHub Raw CDN

## File Naming Convention
- Use lowercase with hyphens: `spanish-101.json`, `french-advanced.json`
- Keep names short and descriptive

## Fields
- **name**: Must match filename (without .json)
- **language**: Human-readable language name
- **type**: `"word"` or `"sentence"`
- **words**: Array of objects with `front` (hint/English) and `back` (answer/translation)

## Testing Locally
1. During dev, sets are fetched from: `https://raw.githubusercontent.com/kamilogram/slowniczek/master/sets/{name}.json`
2. Refresh app to test new sets (may take a few minutes for GitHub CDN to cache)

## Examples
- `spanish-101.json` - Spanish vocabulary level 1
- `french-advanced.json` - Advanced French phrases
- `english-sentences.json` - Example sentences

