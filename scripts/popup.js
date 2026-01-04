$(document).ready(function () {
    //Donate Btn Logic
    $('#donateBtn').on('click', function () {
        window.open('https://www.paypal.com/paypalme/lakshaykaura/2USD', '_blank');
    });

    // Fetch and display statistics
    chrome.storage.sync.get(['qualityChangeCount', 'qualityFrequency'], function (result) {
        // Display the quality changes count
        let count = result.qualityChangeCount || 0;
        $('#qualityChangesCount').find('span.nowrap').text(`${count} times`);

        // Find and display the most common quality
        let frequency = result.qualityFrequency || {};
        let mostCommonQuality = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b, '');
        $('#mostCommonQuality').find('span.nowrap').text(`${mostCommonQuality || 'None'}`);
    });

    // Fetch and display the current interval
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        $('#interval').val(interval / 1000);
    });

    //Fetch and display the current max quality
    chrome.storage.sync.get('maxQuality', function (data) {
        let maxQuality = data.maxQuality || '1080p';
        $('#max-quality').val(maxQuality);
    });

    // Save the interval and selected max quality
    $('#save').on('click', function () {
        let interval = parseInt($('#interval').val(), 10) * 1000;
        chrome.storage.sync.set({ 'checkInterval': interval }, function () {
            let maxQuality = $('#max-quality').val();
            chrome.storage.sync.set({ 'maxQuality': maxQuality }, function () {
                let messageDiv = $('#message');
                messageDiv.show();
                messageDiv[0].scrollIntoView({ behavior: "smooth" });

                $(this).addClass('active-button');

                $('#interval').focus();

                setTimeout(() => {
                    $(this).removeClass('active-button');
                }, 100);

                setTimeout(() => {
                    window.close();
                }, 2500);
            });
        });
    });
});

//Logic to blur the background image on popup open
document.addEventListener('DOMContentLoaded', () => {
    const backgroundImage = document.createElement('div');
    backgroundImage.classList.add('background-image');
    document.body.prepend(backgroundImage);

    Array.from(document.body.children).forEach(child => {
        if (!child.classList.contains('background-image')) {
            child.classList.add('blur-content');
        }
    });

    backgroundImage.addEventListener('animationend', () => {
        Array.from(document.body.children).forEach(child => {
            if (!child.classList.contains('background-image')) {
                child.classList.remove('blur-content');
                child.classList.add('no-blur');
            }
        });
    });
});

