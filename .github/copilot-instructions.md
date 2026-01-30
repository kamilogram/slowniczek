# Copilot Instructions for Słówka

## Project Overview
**Słówka** (Polish for "words") is a flashcard/vocabulary learning application built with React and Vite. It features local word packages and GitHub-hosted remote word sets with auto-play mode, speech synthesis, and dark mode support.

**Architecture:**
- **Frontend**: React 19 + Vite with HMR (`src/` directory)
- **Data Source**: Local packages (`src/data/`) + GitHub-hosted JSON (`sets/` directory)
- **Deployment**: Frontend to GitHub Pages (`base: '/slowniczek/'`)
- **No Backend**: Direct GitHub Raw CDN for remote word sets (instant, free)

## Key Development Workflows

### Running the Application
- **Frontend dev**: `npm run dev` - starts Vite dev server on localhost:5173
- **Build**: `npm run build` - creates optimized Vite bundle in `dist/`
- **Deploy**: `npm run predeploy && npm run deploy` - builds and deploys to GitHub Pages
- **Lint**: `npm run lint` - runs ESLint on all `.js` and `.jsx` files

### Environment Setup
No backend environment variables needed. The app uses GitHub Raw CDN for remote word sets.

## Critical Architecture Patterns

### Game Logic Hub: `useGameLogic()`
[useGameLogic.js](../src/hooks/useGameLogic.js) is the **central state management** hook (~550 lines). It manages:
- Quiz state machine (`'start'` → `'quiz'`)
- Combined word pool (local + remote + custom words)
- Spaced repetition tracking (`used` array in localStorage)
- Auto-play mode with configurable timers
- Integration with speech synthesis, storage, and API

**Pattern**: All game flow decisions originate here; components dispatch actions via callbacks.

### Multi-Source Data Loading
The `startGame()` method in useGameLogic combines:
1. **Local packages**: Static JS files (`allWords.js`, `allWords2.js`, `easiest`, `zdania`)
2. **Remote sets**: Supabase queries via `getSets()` → `getSet(name)`
3. **Custom words**: User-input text parsed and stored

**Key detail**: Custom words use semicolon delimiter (`;`) per [useGameLogic.js](../src/hooks/useGameLogic.js).

### Storage LayerGitHub Raw JSON files fetched via `getSet(name)` from `/sets/:name.json`
One-tier persistence:
- **localStorage** via [storage.js](../src/services/storage.js): Game state, dark mode toggle, selected packages, memory lists`api.js` must be kept in sync with repo files

All localStorage keys prefixed with `slowka` (e.g., `slowkaUsed`, `slowkaAutoMode`).

### API Communication
[api.js](../src/services/api.js) abstracts backend calls with:
- Environment-aware base URL (localhost fordata loading with:
- GitHub Raw CDN URL: `https://raw.githubusercontent.com/kamilogram/slowniczek/master/sets/:name.json`
- Hardcoded list of available sets (must match files in repo `/sets/` folder)
- `getSets()` returns static list
- `getSet(name)` fetches JSON directly from GitHub Raw (instant, CDN-cached
### Speech Synthesis Integration
[speech.js](../src/services/speech.js) wraps Web Speech API:
- Pre-initialized on app startup to handle browser security requirements
- Respects `answerLanguage` setting (`en-US`, etc.)
- Cancellation support for rapid interactions

## Project-Specific Conventions

### Component Structure
- **Page components** (StartScreen, MainApp): Handle layout and orchestration
- **Feature components** (FlashCard, Controls, PackageEditor): Receive data + callbacks as props
- **No prop drilling**: `useGameLogic()` hook passed to MainApp, then distributed via context pattern

### CSS Patterns
- Dark mode: Toggle `dark-mode` class on `<body>` (see [App.jsx](../src/App.jsx) lines 16-19)
- Component styling: Local `.jsx` paired CSS files (e.g., `FlashCard.jsx` + `FlashCard.css`)
- Vite base path: Routes and assets use `/slowniczek/` prefix (vite.config.js)

### ESLint Rules
- Ignores unused vars matching pattern `^[A-Z_]` (constants, component imports)
- React Hooks rules enforced (stable dependencies)
- React Refresh plugin enabled for hot module replacement

### Data Format Example
Local word package structure (allWords.js):
```javascript
export default [
  { front: "apple", back: "jabłko", type: "word" },
  { front: "book", back: "książka", type: "word" }
]
```

Remote set structure (Supabase JSON):
```json
{
  "name": "spanish-101",
  "words": [{ "front": "...", "back": "..." }],
  "language": "Spanish",
  "type": "word"
}
```

## Common Tasks
Remote Word Set

1. Create JSON file in `sets/` folder following this schema:
```json
{
  "name": "language-level",
  "language": "Language Name",
  "type": "word",
  "words": [
    { "front": "hint", "back": "answer" },
    { "front": "word", "back": "translation" }
  ]
}
```Remote Sets**: GitHub Raw CDN - instant worldwide delivery, no cold start
- **Free Tier**: Completely free hosting (GitHub Pages + GitHub Raw CDN)
2. Update `AVAILABLE_SETS` in [api.js](../src/services/api.js):
```javascript
const AVAILABLE_SETS = [
  { name: 'spanish-101', language: 'Spanish', type: 'word', count: 0 },
  { name: 'your-new-set', language: 'Language', type: 'word', count: 0 },
];
```

3. api.js](../src/services/api.js) | GitHub Raw CDN integration, available sets list

### Debugging Game State
Use Redux DevTools browser extension on `gameLogic` state via React Profiler, or inspect `window.localStorage` for persistence issues.

### Modifying Auto-Play Timers
[useGameLogic.js](../src/hooks/useGameLogic.js) lines 35-40 define intervals; adjust `autoStep` cycling and `autoTimeLeft` countdown durations.

## Deployment Notes
- **Frontend**: GitHub Pages serves from `/slowniczek/` subdirectory (Vite base path must match)
- **Backend**: Render.com free tier; cold starts add ~15sec latency
- **Supabase**: Row-level security currently disabled (public access); restrict in production

## Files to Know
| File | Purpose |
|------|---------|
| [App.jsx](../src/App.jsx) | Root component, dark mode toggle, game state routing |
| [useGameLogic.js](../src/hooks/useGameLogic.js) | Core state machine (~550 lines, READ THIS FIRST) |
| [MainApp.jsx](../src/components/MainApp.jsx) | Quiz UI orchestration |
| [backend/server.js](../backend/server.js) | Express endpoints, Supabase queries |
| [supabase-schema.sql](../supabase-schema.sql) | Database schema and RLS policies |
| [vite.config.js](../vite.config.js) | Build config, GitHub Pages base path |
