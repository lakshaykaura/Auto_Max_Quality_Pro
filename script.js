function getIntervalAndRun() {
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 15000;
        window.checkAndAdjustYouTubeVideoQuality(interval);
    });
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