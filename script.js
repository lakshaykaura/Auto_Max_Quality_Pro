function getIntervalAndRun() {
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        window.checkAndAdjustYouTubeVideoQuality(interval);
    });
}

function showSuccessMessage(selectedQuality, videoFrame) {
    const successMessage = $('<div>', {
        id: 'success-message',
        class: 'success-message',
        text: `"YouTube Max Quality Switcher" automatically switched quality to ${selectedQuality}`
    }).css({
        'position': 'absolute',
        'top': '5%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'z-index': '9999',
        'background': 'rgba(0, 0, 0, 0.8)',
        'color': '#fff',
        'padding': '10px',
        'border-radius': '5px',
        'opacity': '0',
        'transition': 'opacity 1s'
    });
    if (videoFrame) {
        $(videoFrame).append(successMessage);
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
        let doc = window.self !== window.top ? window.document : window.top.document;
        if (window.location.host.includes('youtube.com') || (doc?.title?.includes('YouTube'))) {
            let title = doc.title.replace(' - YouTube', '');
            return title.replace(/^\(\d+\)\s/, '');
        }
        return null;
    }

    function adjustQuality() {
        let settingsButton = document.querySelector('button.ytp-settings-button');

        if (settingsButton && shouldAdjustQuality) {
            settingsButton.click();

            setTimeout(() => {
                let qualityMenu = document.querySelector('.ytp-panel-menu[role="menu"] > .ytp-menuitem:last-child');
                if (qualityMenu) {
                    qualityMenu.click();

                    setTimeout(() => {
                        let availableQualities = document.querySelectorAll('.ytp-quality-menu .ytp-panel-menu[role="menu"] > .ytp-menuitem');
                        if (availableQualities.length > 0) {
                            availableQualities[0].click();
                            let videoFrame = $(availableQualities).parents('div.html5-video-player')
                            showSuccessMessage(availableQualities[0].innerText.trim(), videoFrame);
                            console.log(`Changed quality to ${availableQualities[0].innerText.trim()} for: ${getYouTubeTitle()}`);
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
    const settingsButton = document.querySelector('button.ytp-settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', function () {
            console.log(`Clicked settings button for: ${getYouTubeTitle()}`);
            // Flag that the user interacted with the settings
            shouldAdjustQuality = true;

            // If the user interacts with the settings, set a timer to adjust the quality after the given interval
            clearTimeout(timer);
            timer = setTimeout(adjustQuality, interval);
        });
    }
};

getIntervalAndRun();