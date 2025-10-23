const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:3001' : 'https://slowka-backend.onrender.com';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
}

export function getSets() {
    return fetchAPI('/api/sets');
}

export function getSet(name) {
    return fetchAPI(`/api/sets/${encodeURIComponent(name)}`);
}

export function saveSet(name, words, language, type) {
    return fetchAPI(`/api/sets/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, language, type }),
    });
}

export function deleteSet(name) {
    return fetchAPI(`/api/sets/${encodeURIComponent(name)}`, {
        method: 'DELETE',
    });
}