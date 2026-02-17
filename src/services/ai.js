/**
 * AI Package Generator using Groq API (free)
 * Generates vocabulary/sentence packages based on user description
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generatePackage({
  description,
  language,
  wordCount,
  type, // 'word' or 'sentence'
  packageName
}) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY nie jest ustawiony w .env.local');
  }

  // Normalize language name to match app convention
  const normalizeLanguage = (lang) => {
    const map = {
      'polski': 'Polski',
      'angielski': 'Angielski',
      'niemiecki': 'Niemiecki',
      'francuski': 'Francuski',
      'hiszpański': 'Hiszpański',
      'włoski': 'Włoski',
      'rosyjski': 'Rosyjski',
      'japoński': 'Japoński',
      'chiński': 'Chiński'
    };
    return map[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const prompt = buildPrompt({
    description,
    language,
    wordCount,
    type,
  });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Updated model
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response
    const parsed = parseResponse(content, type);

    return {
      name: packageName,
      language: normalizeLanguage(language),
      type,
      words: parsed,
      count: parsed.length,
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

function buildPrompt({ description, language, wordCount, type }) {
  if (type === 'word') {
    return `Generate exactly ${wordCount} vocabulary words in JSON format for learning ${language}.
Topic: ${description}

You MUST respond with ONLY a valid JSON array (no markdown, no explanation), like this:
[
  {"hint": "Polish word", "answer": "${language} translation"},
  {"hint": "another Polish word", "answer": "${language} translation"}
]

Requirements:
- Each item must have "hint" and "answer" fields
- Hint should be in Polish
- Answer should be ${language} translation
- Total items: ${wordCount}
- Valid JSON only, no extra text`;
  } else {
    return `Generate exactly ${wordCount} example sentences in JSON format for learning ${language}.
Topic: ${description}

You MUST respond with ONLY a valid JSON array (no markdown, no explanation), like this:
[
  {"hint": "Polish sentence", "answer": "${language} translation"},
  {"hint": "another Polish sentence", "answer": "${language} translation"}
]

Requirements:
- Each item must have "hint" and "answer" fields
- Hint should be a sentence in Polish
- Answer should be ${language} translation
- Sentences should be practical and useful for learning
- Total items: ${wordCount}
- Valid JSON only, no extra text`;
  }
}

function parseResponse(content, type) {
  // Remove markdown code blocks if present
  let json = content.trim();
  if (json.startsWith('```json')) {
    json = json.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (json.startsWith('```')) {
    json = json.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    const parsed = JSON.parse(json);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and normalize entries
    const validated = parsed.map(item => {
      if (!item.hint || !item.answer) {
        throw new Error('Invalid entry: missing hint or answer field');
      }
      return {
        hint: String(item.hint).trim(),
        answer: String(item.answer).trim(),
        type: type,
      };
    });

    return validated;
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}
