const qualityPriority = ['4320p', '2880p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

function getIntervalAndRun() {
    chrome.storage.sync.get('checkInterval', function (data) {
        const interval = data.checkInterval || 60000;
        window.checkAndAdjustYouTubeVideoQuality(interval);
    });
}

function incrementQualityChangeCount() {
    chrome.storage.sync.get({qualityChangeCount: 0}, function (result) {
        let count = result.qualityChangeCount;
        count++;
        chrome.storage.sync.set({qualityChangeCount: count});
    });
}

function trackMostCommonQuality(quality) {
    chrome.storage.sync.get({qualityFrequency: {}}, function (result) {
        let frequency = result.qualityFrequency;
        frequency[quality] = (frequency[quality] || 0) + 1;
        chrome.storage.sync.set({qualityFrequency: frequency});
    });
}

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

window.checkAndAdjustYouTubeVideoQuality = function (interval) {
    let shouldAdjustQuality = false;
    let timer = null;

    function getYouTubeTitle() {
        const doc = window.self !== window.top ? window.document : window.top.document;
        if (window.location.host.includes('youtube.com') || (doc.title.includes('YouTube'))) {
            return doc.title.replace(' - YouTube', '').replace(/^\(\d+\)\s/, '');
        }
        return null;
    }

    function adjustQuality() {
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
                                console.log(`Auto Max Quality Pro Extension: Changed quality to ${selectedQuality.text().trim()} for: ${getYouTubeTitle()}`);
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
    adjustQuality();

    // Observe interactions with the settings button
    const settingsButton = $('button.ytp-settings-button');
    if (settingsButton.length) {
        settingsButton.on('click', function () {
            console.log(`Auto Max Quality Pro Extension: Clicked settings button for: ${getYouTubeTitle()}`);
            shouldAdjustQuality = true;
            clearTimeout(timer);
            timer = setTimeout(adjustQuality, interval);
        });
    }
};

getIntervalAndRun();