const synth = window.speechSynthesis;
let voices = [];
let voicesPromise = null;

function init() {
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve, reject) => {
    const load = () => {
      voices = synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return true;
      }
      return false;
    };

    // If voices are already available, resolve immediately.
    if (load()) {
      return;
    }

    // Otherwise, wait for the event.
    const handleVoicesChanged = () => {
      if (load()) {
        synth.onvoiceschanged = null;
      }
    };
    
    synth.onvoiceschanged = handleVoicesChanged;
    
    // Add a timeout as a fallback for browsers that don't fire the event reliably
    setTimeout(() => {
      if (!load()) {
        // Try one more time after timeout
        voices = synth.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          console.warn("Speech synthesis voices did not load after timeout.");
          // Resolve anyway with empty array to not block the app
          resolve([]);
        }
      }
      synth.onvoiceschanged = null;
    }, 1000);
  });
  return voicesPromise;
}

// Start loading voices immediately when the module is loaded.
init().catch(e => console.error(e));

/**
 * Returns a promise that resolves with an array of available SpeechSynthesisVoice objects.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export async function getVoices() {
  return await init();
}

/**
 * Speaks the given text in the specified language.
 * @param {string} text The text to speak.
 * @param {string} lang The language code (e.g., 'pl-PL', 'en-US').
 */
export async function speak(text, lang, rate = 1.0) {
  if (!synth || !text) {
    return;
  }

  await init(); // Ensure voices are loaded before attempting to speak.

  // Chrome-specific fix: If synth is paused, resume it to "wake it up".
  if (synth.paused) {
    synth.resume();
  }

  cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  // Set speaking rate (0.1 - 10, typical values 0.5 - 2.0)
  utterance.rate = rate || 1.0;

  const voiceForLang = voices.find(v => v.lang === lang);
  if (voiceForLang) {
    utterance.voice = voiceForLang;
  } else {
    console.warn(`No specific voice found for lang "${lang}". Using browser default.`);
  }

  // Ensure we have voices before speaking (double check for mobile browsers)
  if (voices.length === 0) {
    // Force reload voices one more time
    voices = synth.getVoices();
  }

  synth.speak(utterance);
}

/**
 * Cancels any currently speaking or queued utterances.
 */
export function cancel() {
  // Check if the synth is currently speaking before trying to cancel.
  if (synth && (synth.speaking || synth.pending)) {
    synth.cancel();
  }
}
