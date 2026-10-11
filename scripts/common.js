// Function to increment the quality change count in statistics
function incrementQualityChangeCount() {
    chrome.storage.sync.get({ qualityChangeCount: 0 }, function (result) {
        let count = result.qualityChangeCount;
        count++;
        chrome.storage.sync.set({ qualityChangeCount: count });
    });
}

// Function to track the most common quality in statistics
function trackMostCommonQuality(quality) {
    chrome.storage.sync.get({ qualityFrequency: {} }, function (result) {
        let frequency = result.qualityFrequency;
        frequency[quality] = (frequency[quality] || 0) + 1;
        chrome.storage.sync.set({ qualityFrequency: frequency });
    });
}

// Pick from the resolutions a video offers: the preferred one or the next best below it. If they are all higher,
// the highest. Returns null when there is nothing to pick from.
function pickPreferredResolution(resolutions, maxQuality) {
    // "Highest Available" puts no cap on the resolution
    const maxResolution = parseInt(maxQuality, 10) || Infinity;
    const suitable = resolutions.filter(resolution => resolution <= maxResolution);
    const candidates = suitable.length ? suitable : resolutions;
    return candidates.length ? Math.max(...candidates) : null;
}

// Function to show a success message in video when the quality is changed
function showSuccessMessage(selectedQuality, videoFrame) {
    const successMessage = $('<div>', {
        id: 'success-message',
        class: 'success-message',
        text: `"Auto Max Quality Pro" automatically switched quality to ${selectedQuality}`
    }).css({
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '9999',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        opacity: '0',
        transition: 'opacity 1s'
    });

    if (videoFrame) {
        videoFrame.append(successMessage);
    }

    setTimeout(() => {
        successMessage.css('opacity', '0.6');
        setTimeout(() => {
            successMessage.css('opacity', '0');
            setTimeout(() => {
                successMessage.remove();
            }, 500);
        }, 1500);
    }, 100);
}

// Record a quality switch (statistics, analytics) and, unless switched off in the popup, show the message over the video
function reportQualitySwitch(qualityText, videoFrame) {
    sendEvent('quality_change', { quality: qualityText });
    trackMostCommonQuality(qualityText);
    incrementQualityChangeCount();
    chrome.storage.sync.get('showSwitchMessage', function (data) {
        if (data.showSwitchMessage !== false) {
            showSuccessMessage(qualityText, videoFrame);
        }
    });
}

// Send GA Event helper
function sendEvent(eventName, params = {}) {
    // Add default device/browser info that is available in Content Script/Popup but NOT in Service Worker
    const enhancedParams = {
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        page_title: document.title,
        page_location: window.location.href,
        ...params
    };

    chrome.runtime.sendMessage({
        type: 'GA_EVENT',
        eventName,
        params: enhancedParams
    });
}
