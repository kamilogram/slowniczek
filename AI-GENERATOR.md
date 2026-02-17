# 🤖 AI Package Generator

Generuj nowe pakiety słówek/zdań za pomocą sztucznej inteligencji!

## Setup

### 1. Zdobądź darmowy API key od Groq

1. Wejdź na https://console.groq.com
2. Zaloguj się (lub załóż konto)
3. Skopiuj API key z dashboard

### 2. Dodaj API key do projektu

Utwórz plik `.env.local` w głównym folderze projektu:

```
VITE_GROQ_API_KEY=your_api_key_here
```

Zamiast `your_api_key_here` wklej swój API key z Groq.

### 3. Start

```bash
npm run dev
```

## Jak używać

1. **Otwórz StartScreen** - przejdź do sekcji wyboru pakietów
2. **Kliknij button** 🤖 "Generuj pakiet z AI"
3. **Wypełnij formularz:**
   - **Opisz czego się nauczysz:** np. "Słówka o zwierzętach leśnych"
   - **Nazwa pakietu:** np. "Zwierzęta lasu B1"
   - **Język:** wybierz z listy (polski, angielski, niemiecki, etc.)
   - **Ilość słówek/zdań:** 10, 20, 30, 50 lub 100
   - **Typ:** słówka lub zdania

4. **Kliknij "Generuj"** - czekaj 5-10 sekund
5. **Preview** - zobacz 5 pierwszych wpisów
6. **Dodaj do pakietów** - pakiet zostaje zapisany w localStorage
7. **Ćwicz** - pakiet pojawia się na liście dostępnych pakietów

## Limity Groq (darmowy tier)

- ✅ 60 requestów na minutę
- ✅ Bez limitów na całkowity ruch
- ✅ Model: Mixtral 8x7B (szybki i dokładny)

Dla większości użytkowników tego więcej niż wystarczy!

## Techniczne detale

- **Model AI:** Mixtral 8x7B (na Groq)
- **Format:** Generuje JSON z polami `front` i `back`
- **Przechowywanie:** localStorage w przeglądarce
- **Offline:** Po wygenerowaniu - pakiet pracuje offline

## Troubleshooting

**P: "VITE_GROQ_API_KEY nie jest ustawiony"**
O: Utwórz `.env.local` w głównym folderze z kluczem API

**P: "Request timeout"**
O: Groq mogą być przytłoczeni. Czekaj minutę i spróbuj ponownie. Lub zmień ilość słówek na mniejszą (10 zamiast 100)

**P: "Invalid JSON response"**
O: Czasem AI nie generuje czystego JSON. Spróbuj zmienić opis lub zmniejszyć ilość słówek

**P: Jak usunąć wygenerowany pakiet?**
O: Przytrzymaj pakiet, naciśnij "Usuń" w edytorze

## API Reference

Jeśli chcesz integrować z innym AI:

```javascript
// src/services/ai.js
export async function generatePackage({
  description,    // string: opis czego uczeń chce się nauczyć
  language,       // string: język docelowy
  wordCount,      // number: ile słów/zdań
  type,           // string: 'word' lub 'sentence'
  packageName     // string: nazwa pakietu
})

// Returns: Promise<{
//   name: string,
//   language: string,
//   type: string,
//   words: [{front, back}, ...],
//   count: number
// }>
```

## Szybkie tipy

- ✨ Bardzo szczegółowe opisy → lepsze rezultaty
- 🎯 "Słówka o jedzeniu" > "jedzenie"
- 🌍 Specyficzny język → lepsze dopasowanie
- ⏱️ 20-30 słów = najszybciej generuje
- 🔄 Nie bój się generować kilka razy, czasem pierwszy wynik nie jest idealny

