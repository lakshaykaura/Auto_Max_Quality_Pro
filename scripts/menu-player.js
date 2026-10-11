// Shared by the sites whose player offers quality in a settings menu (Vimeo, Twitch): open the menu, open its quality
// list and select the preferred quality. `site` says where those controls are:
//   getSettingsButton()   the button that opens the settings menu
//   isMenuOpen()          whether that menu is showing
//   getQualityMenuItem()  the menu entry that opens the quality list
//   getQualityOptions()   the entries of the quality list
//   getResolution(option) an entry's resolution as a number, or null for entries such as "Auto"
//   getLabel(option)      an entry's name, for the message and the statistics
//   isSelected(option)    whether an entry is the active one
//   select(option)        choose an entry
//   getVideoFrame()       where to show the "switched quality" message
window.checkAndAdjustMenuPlayerQuality = function (site) {
    let isAdjusting = false;
    let adjustAgain = false;
    let lastAdjustment = null;
    let retries = 0;
    let retryTimer = null;

    // The player may not have drawn its controls or filled its menu yet: look again shortly, a few times per video
    function retryLater() {
        clearTimeout(retryTimer);
        if (retries < 5) {
            retries++;
            retryTimer = setTimeout(adjustVideoQuality, 2000);
        }
    }

    // Close the settings menu if it's still open, then let the next pass run. `handled` says whether this pass found
    // the quality it was looking for.
    function finishAdjusting(handled) {
        setTimeout(() => {
            if (site.isMenuOpen()) {
                site.getSettingsButton().click();
            }
            isAdjusting = false;
            if (adjustAgain) {
                adjustAgain = false;
                adjustVideoQuality();
            } else if (!handled) {
                retryLater();
            }
        }, 500); // Wait for the selection action to complete
    }

    function adjustVideoQuality() {
        chrome.storage.sync.get('maxQuality', function (data) {
            const maxQuality = data.maxQuality || '1080p';
            const settingsButton = site.getSettingsButton();
            if (!settingsButton.length) {
                retryLater();
                return;
            }

            // One pass at a time; a request that arrives meanwhile is served right after
            if (isAdjusting) {
                adjustAgain = true;
                return;
            }

            // Already handled this page's video with this setting: leave it, and any manual choice made since, alone
            const adjustmentKey = `${location.pathname}|${maxQuality}`;
            if (adjustmentKey === lastAdjustment) {
                return;
            }

            isAdjusting = true;
            if (!site.isMenuOpen()) {
                settingsButton.click();
            }
            setTimeout(() => {
                // The menu can come up already showing the quality list it was left on
                if (!site.getQualityOptions().length) {
                    const qualityMenuItem = site.getQualityMenuItem();
                    if (!qualityMenuItem.length) {
                        finishAdjusting(false);
                        return;
                    }

                    qualityMenuItem.click();
                }

                setTimeout(() => {
                    try {
                        const options = site.getQualityOptions().toArray().map(option => $(option))
                            .filter(option => site.getResolution(option) !== null);
                        const resolution = pickPreferredResolution(options.map(site.getResolution), maxQuality);
                        const selectedQuality = options.find(option => site.getResolution(option) === resolution);
                        if (selectedQuality) {
                            lastAdjustment = adjustmentKey;

                            // Nothing to do when the wanted quality is already the active one
                            if (!site.isSelected(selectedQuality)) {
                                const qualityText = site.getLabel(selectedQuality);
                                site.select(selectedQuality);
                                reportQualitySwitch(qualityText, site.getVideoFrame());
                            }
                        }
                    } finally {
                        finishAdjusting(lastAdjustment === adjustmentKey);
                    }
                }, 500);
            }, 500);
        });
    }

    // Adjust the quality immediately when the page loads
    adjustVideoQuality();

    // Also when a video element appears or loads new data (the next video, or a stream starting)
    const observer = new MutationObserver(() => {
        document.querySelectorAll('video').forEach(video => {
            if (!video.dataset.amqpObserved) {
                video.dataset.amqpObserved = 'true';
                video.addEventListener('loadeddata', adjustVideoQuality);
                retries = 0;
                adjustVideoQuality();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for storage changes to update quality immediately
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'sync' && changes.maxQuality) {
            adjustVideoQuality();
        }
    });
};
