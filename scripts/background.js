const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const MEASUREMENT_ID = 'G-LWKPJYEWEX';
const API_SECRET = 'iMLCjOLTSNykTm8btduGWg'
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;

// Unique ID for the session
let sessionId = null;

// Get or create a unique client ID
async function getOrCreateClientId() {
    const result = await chrome.storage.local.get('clientId');
    let clientId = result.clientId;
    if (!clientId) {
        clientId = self.crypto.randomUUID();
        await chrome.storage.local.set({ clientId });
    }
    return clientId;
}

// Get or create a session ID
async function getOrCreateSessionId() {
    const currentTimeInMs = Date.now();
    if (!sessionId) {
        sessionId = currentTimeInMs.toString();
    }
    return sessionId;
}

// Send an event to GA4
async function sendAnalyticsEvent(name, params = {}) {
    if (!MEASUREMENT_ID || MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        console.warn('GA Measurement ID not set.');
        return;
    }

    const clientId = await getOrCreateClientId();
    const currentSessionId = await getOrCreateSessionId();

    const requestParams = {
        client_id: clientId,
        events: [{
            name,
            params: {
                session_id: currentSessionId,
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
                // Default to background context if not provided (e.g. system events)
                language: navigator.language, // navigator is valid in SW
                page_location: 'chrome-extension://' + chrome.runtime.id,
                ...params
            }
        }]
    };

    try {
        await fetch(`${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`, {
            method: 'POST',
            body: JSON.stringify(requestParams)
        });
        console.log(`GA Event sent: ${name}`, params);
    } catch (e) {
        console.error('Failed to send GA event', e);
    }
}

// Listen for installation events
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await sendAnalyticsEvent('app_install', { version: chrome.runtime.getManifest().version });
    } else if (details.reason === 'update') {
        await sendAnalyticsEvent('app_update', { version: chrome.runtime.getManifest().version });
    }
});

// Listen for messages from content scripts/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GA_EVENT') {
        sendAnalyticsEvent(message.eventName, message.params);
    }
});
