// Function to increment the quality change count in statistics
function incrementQualityChangeCount() {
    chrome.storage.sync.get({qualityChangeCount: 0}, function (result) {
        let count = result.qualityChangeCount;
        count++;
        chrome.storage.sync.set({qualityChangeCount: count});
    });
}

// Function to track the most common quality in statistics
function trackMostCommonQuality(quality) {
    chrome.storage.sync.get({qualityFrequency: {}}, function (result) {
        let frequency = result.qualityFrequency;
        frequency[quality] = (frequency[quality] || 0) + 1;
        chrome.storage.sync.set({qualityFrequency: frequency});
    });
}

// Function to show a success message in video when the quality is changed
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
