function getIntervalAndRun() {
    chrome.storage.sync.get('checkInterval', function (data) {
        const interval = data.checkInterval || 60000;
        window.checkAndAdjustYouTubeVideoQuality(interval);
    });
}

function showSuccessMessage(selectedQuality, videoFrame) {
    const successMessage = $('<div>', {
        id: 'success-message',
        class: 'success-message',
        text: `"YouTube Max Quality Switcher" automatically switched quality to ${selectedQuality}`
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
        const settingsButton = $('button.ytp-settings-button');
        if (settingsButton.length && shouldAdjustQuality) {
            settingsButton.click();
            setTimeout(() => {
                const qualityMenu = $('.ytp-panel-menu[role="menu"] > .ytp-menuitem:last-child');
                if (qualityMenu.length) {
                    qualityMenu.click();
                    setTimeout(() => {
                        const availableQualities = $('.ytp-quality-menu .ytp-panel-menu[role="menu"] > .ytp-menuitem');
                        if (availableQualities.length) {
                            availableQualities.first().click();
                            const videoFrame = availableQualities.parents('div.html5-video-player');
                            showSuccessMessage(availableQualities.first().text().trim(), videoFrame);
                            console.log(`YouTube Max Quality Switcher Extension: Changed quality to ${availableQualities.first().text().trim()} for: ${getYouTubeTitle()}`);
                        }

                        // Close settings panel
                        settingsButton.click();

                        // Reset the flag
                        shouldAdjustQuality = false;
                    }, 500);
                }
            }, 500);
        }
    }

    // Adjust the quality immediately when the page loads
    shouldAdjustQuality = true;
    adjustQuality();

    // Observe interactions with the settings button
    const settingsButton = $('button.ytp-settings-button');
    if (settingsButton.length) {
        settingsButton.on('click', function () {
            console.log(`YouTube Max Quality Switcher Extension: Clicked settings button for: ${getYouTubeTitle()}`);
            shouldAdjustQuality = true;
            clearTimeout(timer);
            timer = setTimeout(adjustQuality, interval);
        });
    }
};

getIntervalAndRun();