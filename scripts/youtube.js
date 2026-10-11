// Channel to youtube-player-bridge.js, which runs in the page's world and can ask the player about itself
const PLAYER_INFO_REQUEST = 'amqp-player-info-request';
const PLAYER_INFO_ATTRIBUTE = 'data-amqp-player-info';
const PLAYBACK_RATE_REQUEST = 'amqp-playback-rate-request';
const PLAYBACK_RATE_ATTRIBUTE = 'data-amqp-playback-rate';
const QUALITY_REQUEST = 'amqp-quality-request';
const QUALITY_ATTRIBUTE = 'data-amqp-quality';

// The page can hold several players (watch page, miniplayer, hover previews); use the one that is on screen
function getActiveYouTubePlayer() {
    return $('.html5-video-player:visible').has('button.ytp-settings-button').first();
}

// Embedded players and Shorts have no settings menu to click through
function getMenulessYouTubePlayer() {
    const players = $('.html5-video-player:visible');
    return (location.pathname.startsWith('/embed/') ? players : players.filter('#shorts-player')).first();
}

// Set the quality through the player itself (via the page-world bridge), by the player's own name for it, e.g.
// "hd1080". The bridge takes the request off the player once handled; returns whether it did.
function setYouTubeQuality(player, quality) {
    player.attr(QUALITY_ATTRIBUTE, quality);
    document.dispatchEvent(new CustomEvent(QUALITY_REQUEST));
    const handled = player.attr(QUALITY_ATTRIBUTE) === undefined;
    player.removeAttr(QUALITY_ATTRIBUTE);
    return handled;
}

// "Quality" is not always the last settings entry, so find it by its value: it is the only submenu entry showing a
// resolution, such as "Auto (720p60)" or "1080p HD". Before playback starts it only reads "Auto", and is then the last one.
function findQualityMenuItem(player) {
    const submenuItems = player.find('.ytp-settings-menu .ytp-panel-menu > .ytp-menuitem[aria-haspopup="true"]');
    const withResolution = submenuItems.filter(function () {
        return /\d{3,4}[ps]/.test($(this).find('.ytp-menuitem-content').text());
    });
    return withResolution.length ? withResolution.last() : submenuItems.last();
}

// Quality menu label without its badges, e.g. "1080p Premium" out of "1080p Premium HD Enhanced bitrate".
// This is the text the player reports as the entry's qualityLabel.
function getQualityLabel(menuItem) {
    const label = menuItem.clone();
    label.find('sup, .ytp-premium-label').remove();
    return label.text().replace(/\s+/g, ' ').trim();
}

// Ask the page-world bridge which video the player holds and which quality labels this viewer can and cannot play.
// Returns null when the bridge or the player's API is unavailable.
function getPlayerInfo(player) {
    player.removeAttr(PLAYER_INFO_ATTRIBUTE);
    document.dispatchEvent(new CustomEvent(PLAYER_INFO_REQUEST));
    try {
        const playerInfo = JSON.parse(player.attr(PLAYER_INFO_ATTRIBUTE));
        return Array.isArray(playerInfo.playable) && Array.isArray(playerInfo.restricted) ? playerInfo : null;
    } catch (e) {
        return null;
    }
}

// Choose the quality menu entry to select: the preferred resolution or, if the video lacks it, the next lower one
function pickQualityMenuItem(player, playerInfo, maxQuality, preferEnhancedBitrate) {
    const selectableQualities = [];

    player.find('.ytp-quality-menu .ytp-panel-menu > .ytp-menuitem').each(function () {
        const menuItem = $(this);
        const label = getQualityLabel(menuItem);
        // Labels lead with the resolution, from "144p" up to "4320p60 HDR" (8K); 360° videos use "2160s".
        // Anything else is "Auto", the "missing options" link or a survey row.
        const resolution = /^(\d{3,4})[ps]/.exec(label);
        if (!resolution) {
            return;
        }

        // YouTube tags Premium-only bitrates with a label row; the words cover players that do not render it
        const enhanced = menuItem.find('.ytp-premium-label').length > 0
            || /premium|enhanced|high bitrate/i.test(menuItem.text());

        // Clicking an enhanced entry without a membership opens an upsell and leaves the quality on "Auto",
        // so it is only eligible when the player confirms it is playable
        const selectable = enhanced
            ? preferEnhancedBitrate && playerInfo !== null && playerInfo.playable.includes(label)
            : !(playerInfo !== null && playerInfo.restricted.includes(label));
        if (selectable) {
            selectableQualities.push({ menuItem, enhanced, resolution: parseInt(resolution[1], 10) });
        }
    });

    // "Highest Available" puts no cap on the resolution
    const maxResolution = parseInt(maxQuality, 10) || Infinity;

    // Select the preferred quality or the next best one below it. If no suitable quality was found, choose the
    // highest available.
    const suitableQualities = selectableQualities.filter(quality => quality.resolution <= maxResolution);
    const qualities = suitableQualities.length ? suitableQualities : selectableQualities;
    if (!qualities.length) {
        return null;
    }

    const bestResolution = Math.max(...qualities.map(quality => quality.resolution));
    const candidateQualities = qualities.filter(quality => quality.resolution === bestResolution);

    // If multiple matches for the same resolution, prefer the enhanced bitrate one (only listed when wanted)
    return (candidateQualities.find(quality => quality.enhanced) || candidateQualities[0]).menuItem;
}

// Check and adjust the quality of the YouTube video
window.checkAndAdjustYouTubeVideoQuality = function (interval) {
    let shouldAdjustQuality = false;
    let isAdjusting = false;
    let adjustAgain = false;
    let lastAdjustment = null;
    let timer = null;
    let adTimer = null;

    // Identifies "this video with these settings". The video's own URL will not do: the player swaps it on every
    // quality change, including the one made here.
    function getAdjustmentKey(playerInfo, maxQuality, preferEnhancedBitrate) {
        return playerInfo && playerInfo.videoId ? `${playerInfo.videoId}|${maxQuality}|${preferEnhancedBitrate}` : null;
    }

    // Players without a settings menu: choose among the standard qualities the player reports and set it directly
    function adjustMenulessVideoQuality(maxQuality, showSwitchMessage) {
        const player = getMenulessYouTubePlayer();
        if (!player.length) {
            return;
        }

        if (player.hasClass('ad-showing')) {
            clearTimeout(adTimer);
            adTimer = setTimeout(adjustVideoQuality, 1000);
            return;
        }

        const playerInfo = getPlayerInfo(player);
        const adjustmentKey = getAdjustmentKey(playerInfo, maxQuality, false);
        if (!adjustmentKey || adjustmentKey === lastAdjustment || !playerInfo.levels) {
            return;
        }

        const labels = playerInfo.playable.filter(label => /^\d{3,4}[ps]/.test(label) && !/premium/i.test(label) && playerInfo.levels[label]);
        const resolution = pickPreferredResolution(labels.map(label => parseInt(label, 10)), maxQuality);
        const label = labels.find(candidate => parseInt(candidate, 10) === resolution);
        if (!label) {
            return;
        }

        lastAdjustment = adjustmentKey;
        if (playerInfo.levels[label] !== playerInfo.preferredQuality && setYouTubeQuality(player, playerInfo.levels[label])) {
            sendEvent('quality_change', { quality: label });
            trackMostCommonQuality(label);
            incrementQualityChangeCount();
            if (showSwitchMessage) {
                showSuccessMessage(label, player);
            }
        }
    }

    // Close the settings panel if it's still open, then let the next pass run
    function finishAdjusting(settingsButton) {
        // Reset the flag
        shouldAdjustQuality = false;

        setTimeout(() => {
            if (settingsButton.attr('aria-expanded') === 'true') {
                settingsButton.click();
            }
            isAdjusting = false;
            if (adjustAgain) {
                adjustAgain = false;
                shouldAdjustQuality = true;
                adjustVideoQuality();
            }
        }, 500); // Wait for the selection action to complete
    }

    // Function to adjust the quality of the YouTube video
    function adjustVideoQuality() {
        chrome.storage.sync.get(['maxQuality', 'preferEnhancedBitrate', 'showSwitchMessage'], function (data) {
            const maxQuality = data.maxQuality || '1080p';
            const preferEnhancedBitrate = data.preferEnhancedBitrate !== false;
            const showSwitchMessage = data.showSwitchMessage !== false;
            const player = getActiveYouTubePlayer();
            const settingsButton = player.find('button.ytp-settings-button');
            if (!settingsButton.length) {
                adjustMenulessVideoQuality(maxQuality, showSwitchMessage);
                return;
            }

            // One pass at a time: overlapping passes toggle the settings panel shut under each other.
            // A request that arrives meanwhile (e.g. the next video loaded) is served right after. This is checked
            // before the flag, which the running pass resets while it is still finishing.
            if (isAdjusting) {
                adjustAgain = true;
                return;
            }

            if (!shouldAdjustQuality) {
                return;
            }

            // An ad has no Quality entry in its settings; wait for the actual video
            if (player.hasClass('ad-showing')) {
                clearTimeout(adTimer);
                adTimer = setTimeout(adjustVideoQuality, 1000);
                return;
            }

            // Already handled this video with these settings: leave it, and any manual choice made since, alone.
            // Changing the quality reloads the video's data, which would otherwise bring every change straight back here.
            const adjustmentKey = getAdjustmentKey(getPlayerInfo(player), maxQuality, preferEnhancedBitrate);
            if (adjustmentKey && adjustmentKey === lastAdjustment) {
                return;
            }

            isAdjusting = true;
            if (settingsButton.attr('aria-expanded') !== 'true') {
                settingsButton.click();
            }
            setTimeout(() => {
                const qualityMenu = findQualityMenuItem(player);
                if (!qualityMenu.length) {
                    finishAdjusting(settingsButton);
                    return;
                }

                qualityMenu.click();
                setTimeout(() => {
                    try {
                        // If the player moved on to another video while the menu was opening, the rows on screen
                        // may still be the previous video's: leave them and start over
                        const playerInfo = getPlayerInfo(player);
                        const currentKey = getAdjustmentKey(playerInfo, maxQuality, preferEnhancedBitrate);
                        if (adjustmentKey && currentKey && currentKey !== adjustmentKey) {
                            adjustAgain = true;
                            return;
                        }

                        const selectedQuality = pickQualityMenuItem(player, playerInfo, maxQuality, preferEnhancedBitrate);
                        if (selectedQuality) {
                            lastAdjustment = currentKey;
                        }

                        // Nothing to do when the wanted quality is already the active one
                        if (selectedQuality && selectedQuality.attr('aria-checked') !== 'true') {
                            const qualityText = selectedQuality.clone().find('.ytp-premium-label').remove().end().text().trim();
                            selectedQuality.click();
                            sendEvent('quality_change', { quality: qualityText });
                            trackMostCommonQuality(qualityText);
                            incrementQualityChangeCount();
                            if (showSwitchMessage) {
                                const videoFrame = selectedQuality.parents('div.html5-video-player');
                                showSuccessMessage(qualityText, videoFrame);
                            }
                        }
                    } finally {
                        finishAdjusting(settingsButton);
                    }
                }, 500);
            }, 500);
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
        });
    }

    // Listen for storage changes to update quality immediately
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'sync' && (changes.maxQuality || changes.preferEnhancedBitrate || changes.checkInterval)) {
            shouldAdjustQuality = true;
            adjustVideoQuality();
        }
    });
};

// Change the speed through the player (via the page-world bridge), so that YouTube's own speed menu stays in step.
// The bridge takes the request off the player once handled; if it is still there, set the video element directly.
function setYouTubePlaybackRate(player, video, speed) {
    player.attr(PLAYBACK_RATE_ATTRIBUTE, speed);
    document.dispatchEvent(new CustomEvent(PLAYBACK_RATE_REQUEST));
    if (player.attr(PLAYBACK_RATE_ATTRIBUTE) !== undefined) {
        player.removeAttr(PLAYBACK_RATE_ATTRIBUTE);
        video.playbackRate = speed;
    }
}

// Check and adjust the playback speed of the YouTube video
window.checkAndAdjustYouTubeVideoSpeed = function () {
    let lastSpeedAdjustment = null;
    let adTimer = null;

    function adjustVideoSpeed() {
        chrome.storage.sync.get('playbackSpeed', function (data) {
            // "YouTube default" (or nothing saved yet) leaves the speed to YouTube and the viewer
            const speed = parseFloat(data.playbackSpeed);
            const player = getActiveYouTubePlayer();
            const video = player.find('video.html5-main-video')[0];
            if (!speed || !video) {
                return;
            }

            // Wait for the actual video: a speed set during an ad may not carry over to it
            if (player.hasClass('ad-showing')) {
                clearTimeout(adTimer);
                adTimer = setTimeout(adjustVideoSpeed, 1000);
                return;
            }

            // Set the speed once per video, so that a speed the viewer picks afterwards is left alone
            const playerInfo = getPlayerInfo(player);
            const speedAdjustment = playerInfo && playerInfo.videoId ? `${playerInfo.videoId}|${speed}` : null;
            if (speedAdjustment && speedAdjustment === lastSpeedAdjustment) {
                return;
            }
            lastSpeedAdjustment = speedAdjustment;

            if (video.playbackRate !== speed) {
                setYouTubePlaybackRate(player, video, speed);
                console.log(`Auto Max Quality Pro: Adjusted speed to ${speed}x`);
            }
        });
    }

    // Initial check
    adjustVideoSpeed();

    // Listen for navigation
    document.addEventListener('yt-navigate-finish', adjustVideoSpeed);

    // Observer for new video elements
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const video = document.querySelector('video.html5-main-video');
                if (video && !video.dataset.amqpSpeedObserved) {
                    video.dataset.amqpSpeedObserved = 'true';
                    video.addEventListener('loadeddata', adjustVideoSpeed);
                    adjustVideoSpeed();
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'sync' && changes.playbackSpeed) {
            adjustVideoSpeed();
        }
    });
};

// Function to get the title of the YouTube video
function getYouTubeVideoTitle() {
    const doc = window.self !== window.top ? window.document : window.top.document;
    if (window.location.host.includes('youtube.com') || (doc.title.includes('YouTube'))) {
        return doc.title.replace(' - YouTube', '').replace(/^\(\d+\)\s/, '');
    }
    return null;
}