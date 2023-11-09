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
                                for (let i = maxQualityIndex; i < qualityPriority.length; i++) {
                                    availableQualities.each(function () {
                                        if ($(this).text().includes(qualityPriority[i])) {
                                            selectedQuality = $(this);
                                            return false;
                                        }
                                    });
                                    if (selectedQuality) break;
                                }

                                // If no suitable quality was found, choose the highest available
                                if (!selectedQuality) {
                                    selectedQuality = availableQualities.first();
                                }

                                selectedQuality.click();
                                trackMostCommonQuality(selectedQuality.text().trim());
                                incrementQualityChangeCount();
                                const videoFrame = selectedQuality.parents('div.html5-video-player');
                                showSuccessMessage(selectedQuality.text().trim(), videoFrame);
                                console.log(`Auto Max Quality Pro Extension: Changed quality to ${selectedQuality.text().trim()} for: ${getYouTubeVideoTitle()}`);
                            }

                            // Close settings panel
                            settingsButton.click();

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