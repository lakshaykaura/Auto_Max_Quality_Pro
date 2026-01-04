$(document).ready(function () {
    // Donate Interaction
    $('.donate-wrapper').on('click', function (e) {
        e.stopPropagation(); // Stop from closing if clicked inside
        $(this).toggleClass('expanded');
    });

    // Handle clicks on specific tier buttons
    $('.donate-option-btn').on('click', function (e) {
        e.stopPropagation(); // Prevent toggling the wrapper
        const amount = $(this).data('amount');
        sendEvent('donation_click', { source: 'popup', amount: amount });
        window.open(`https://www.paypal.com/paypalme/lakshaykaura/${amount}`, '_blank');
        // Close menu after selection (optional)
        $('.donate-wrapper').removeClass('expanded');
    });

    // Close donate menu when clicking elsewhere
    $(document).on('click', function () {
        $('.donate-wrapper').removeClass('expanded');
    });

    // Empty handler for main btn to prevent default if needed, 
    // but the wrapper handler covers it.
    $('#donateBtn').on('click', function (e) {
        e.preventDefault();
        // Wrapper handles the toggle
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

    // Mouse hover tracking
    let isMouseHovering = false;
    let shouldCloseOnLeave = false;

    $(document).on('mouseenter', function () {
        isMouseHovering = true;
    }).on('mouseleave', function () {
        isMouseHovering = false;
        if (shouldCloseOnLeave) {
            closeExtensionWindow();
        }
    });

    function closeExtensionWindow() {
        $('body').addClass('closing-animation');
        setTimeout(() => {
            window.close();
        }, 400); // 0.4s matching the animation
    }

    // Save the interval and selected max quality
    $('#save').on('click', function () {
        let interval = parseInt($('#interval').val(), 10) * 1000;
        chrome.storage.sync.set({ 'checkInterval': interval }, function () {
            let maxQuality = $('#max-quality').val();
            sendEvent('setting_change', { setting: 'maxQuality', value: maxQuality });
            sendEvent('setting_change', { setting: 'checkInterval', value: interval });
            chrome.storage.sync.set({ 'maxQuality': maxQuality }, function () {
                let messageDiv = $('#message');
                messageDiv.show();
                messageDiv[0].scrollIntoView({ behavior: "smooth" });

                $(this).addClass('active-button');

                setTimeout(() => {
                    $(this).removeClass('active-button');
                }, 100);

                // Wait 2.5s, then handle closure
                setTimeout(() => {
                    messageDiv.fadeOut('fast');

                    if (!isMouseHovering) {
                        closeExtensionWindow();
                    } else {
                        shouldCloseOnLeave = true;
                    }
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

