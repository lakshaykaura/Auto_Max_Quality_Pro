function loadjQuery(callback) {
    var script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    script.onload = callback;
    document.head.appendChild(script);
}

window.checkAndAdjustYouTubeVideoQuality = function () {
    function isYouTubeVideo(url) {
        return url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1;
    }

    function getYouTubeTitle($context) {
        if (window.location.host.includes('youtube.com')) {
            let title = $context.find('title').text().replace(' - YouTube', '');
            return title.replace(/^\(\d+\)\s/, '');
        }
        return null;
    }

    function adjustQuality() {
        let settingsButton = document.querySelector('button.ytp-settings-button');
        if (settingsButton) {
            settingsButton.click();

            setTimeout(() => {
                let qualityMenu = document.querySelector('.ytp-panel-menu[role="menu"] > .ytp-menuitem:last-child');
                if (qualityMenu) {
                    qualityMenu.click();

                    setTimeout(() => {
                        let availableQualities = document.querySelectorAll('.ytp-quality-menu .ytp-panel-menu[role="menu"] > .ytp-menuitem');
                        if (availableQualities.length > 0) {
                            let highestQuality = availableQualities[0];
                            highestQuality.click();
                            console.log(`Changed to ${highestQuality.innerText.trim()} quality for: ${getYouTubeTitle($(document))}`);
                        }

                        // Close settings panel
                        settingsButton.click();
                    }, 500);
                }
            }, 500);
        }
    }

    if (window.location.host.includes('youtube.com') || isYouTubeVideo(window.location.href)) {
        adjustQuality();
    }

    setTimeout(window.checkAndAdjustYouTubeVideoQuality, 15000);  // Check every 15 seconds to account for user manually changing quality or video changes
}

if (typeof jQuery === 'undefined') {
    loadjQuery(window.checkAndAdjustYouTubeVideoQuality);
} else {
    window.checkAndAdjustYouTubeVideoQuality();
}
