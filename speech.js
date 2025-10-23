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
            }
        };
        
        // If voices are already available, resolve immediately.
        if (synth.getVoices().length > 0) {
            load();
        } else {
            // Otherwise, wait for the event.
            synth.onvoiceschanged = load;
            // Add a timeout as a fallback for browsers that don't fire the event reliably
            setTimeout(() => {
                if(voices.length === 0) {
                   load(); // Try one more time
                }
                if(voices.length === 0) {
                    console.warn("Speech synthesis voices did not load after timeout.");
                    reject("Voices not loaded");
                }
            }, 1000);
        }
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
export async function speak(text, lang) {
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

    const voiceForLang = voices.find(v => v.lang === lang);
    if (voiceForLang) {
        utterance.voice = voiceForLang;
    } else {
        console.warn(`No specific voice found for lang "${lang}". Using browser default.`);
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
