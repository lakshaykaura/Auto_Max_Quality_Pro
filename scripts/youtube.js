// List of available qualities in order of priority
const qualityPriority = ['4320p', '2880p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

// Check and adjust the quality of the YouTube video
window.checkAndAdjustYouTubeVideoQuality = function (interval) {
    let shouldAdjustQuality = false;
    let timer = null;

    // Function to adjust the quality of the YouTube video
    function adjustVideoQuality() {
        chrome.storage.sync.get('maxQuality', function (data) {
            const maxQuality = data.maxQuality || '1080p';
            const settingsButton = $('button.ytp-settings-button');
            if (settingsButton.length && shouldAdjustQuality) {
                settingsButton.click();
                setTimeout(() => {
                    const qualityMenu = $('.ytp-panel-menu[role="menu"] > .ytp-menuitem:last-child');
                    if (qualityMenu.length) {
                        qualityMenu.click();
                        setTimeout(() => {
                            let selectedQuality;
                            const availableQualities = $('.ytp-quality-menu .ytp-panel-menu[role="menu"] > .ytp-menuitem');
                            if (availableQualities.length) {
                                // Find the index of the desired quality in the priority list
                                const maxQualityIndex = qualityPriority.indexOf(maxQuality);


                                // Select the next best available quality
                                let startIndex = maxQualityIndex === -1 ? 0 : maxQualityIndex;
                                for (let i = startIndex; i < qualityPriority.length; i++) {
                                    let bestMatch = null;
                                    let candidateQualities = [];

                                    availableQualities.each(function () {
                                        if ($(this).text().includes(qualityPriority[i])) {
                                            candidateQualities.push($(this));
                                        }
                                    });

                                    if (candidateQualities.length > 0) {


                                        // If multiple matches for the same resolution, prefer "Premium" or "Enhanced"
                                        bestMatch = candidateQualities.find(q => {
                                            const text = q.text().toLowerCase();
                                            return text.includes('premium') || text.includes('enhanced') || text.includes('high bitrate');
                                        });

                                        // Fallback to the first match if no premium version found
                                        if (!bestMatch) {
                                            bestMatch = candidateQualities[0];
                                        }

                                        selectedQuality = bestMatch;
                                        break;
                                    }
                                }

                                // If no suitable quality was found, choose the highest available
                                if (!selectedQuality) {
                                    selectedQuality = availableQualities.first();
                                }

                                selectedQuality.click();
                                sendEvent('quality_change', { quality: selectedQuality.text().trim() });
                                trackMostCommonQuality(selectedQuality.text().trim());
                                incrementQualityChangeCount();
                                const videoFrame = selectedQuality.parents('div.html5-video-player');
                                showSuccessMessage(selectedQuality.text().trim(), videoFrame);
                            }

                            // Close settings panel if it's still open
                            setTimeout(() => {
                                if (settingsButton.attr('aria-expanded') === 'true') {
                                    settingsButton.click();
                                }
                            }, 500); // Wait for the selection action to complete

                            // Reset the flag
                            shouldAdjustQuality = false;
                        }, 500);
                    }
                }, 500);
            }
        });
    }

    // Adjust the quality immediately when the page loads
    shouldAdjustQuality = true;
    adjustVideoQuality();

    // CRM: Listen for YouTube's navigation event (SPA navigation)
    document.addEventListener('yt-navigate-finish', function () {
        shouldAdjustQuality = true;
        adjustVideoQuality();
    });

    // CRM: Also observe for video element appearing or source changing
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const video = document.querySelector('video.html5-main-video');
                if (video && !video.dataset.amqpObserved) {
                    video.dataset.amqpObserved = 'true';
                    video.addEventListener('loadeddata', function () {
                        shouldAdjustQuality = true;
                        adjustVideoQuality();
                    });
                    shouldAdjustQuality = true;
                    adjustVideoQuality();
                }
            }
        }
    });

    // Start observing the body for changes (to catch player loading)
    observer.observe(document.body, { childList: true, subtree: true });

    // Observe interactions with the settings button to re-adjust the quality as per the interval
    const settingsButton = $('button.ytp-settings-button');
    if (settingsButton.length) {
        settingsButton.on('click', function () {
            console.log(`Auto Max Quality Pro Extension: Clicked settings button for: ${getYouTubeVideoTitle()}`);
            shouldAdjustQuality = true;
            clearTimeout(timer);
            timer = setTimeout(adjustVideoQuality, interval);
        });
    }
};

// Function to get the title of the YouTube video
function getYouTubeVideoTitle() {
    const doc = window.self !== window.top ? window.document : window.top.document;
    if (window.location.host.includes('youtube.com') || (doc.title.includes('YouTube'))) {
        return doc.title.replace(' - YouTube', '').replace(/^\(\d+\)\s/, '');
    }
    return null;
}