// Function to Initialize Extension: Get the interval from storage and run the script
function initializeExtension() {
    chrome.storage.sync.get('checkInterval', function (data) {
        const interval = data.checkInterval || 60000;
        if (window.location.host.includes('youtube.com') || window.location.host.includes('google') || (document.title.includes('YouTube'))) {
            window.checkAndAdjustYouTubeVideoQuality(interval);
        } else if (window.location.host.includes('linkedin.com')) {
            //linkedin logic
        }
    });
}

initializeExtension();