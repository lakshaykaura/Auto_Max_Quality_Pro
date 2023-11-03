$(document).ready(function () {
    $('#donateBtn').on('click', function () {
        let qrCode = $('#donate-qr');
        qrCode.toggle();

        let otherOptionsDiv = $('div.hide-on-donate-click');
        otherOptionsDiv.toggle();

        let backButtonImage = $('.back-button-img');
        backButtonImage.toggle();

        $(this).toggleClass('active-button');
        if ($(this).hasClass('back-button')) {
            $(this).removeClass('back-button');
            $('.button-text', this).text("Donate Now");
            $('#interval').focus();
        } else {
            $(this).addClass('back-button');
            $('.button-text', this).text("Back");
        }

        setTimeout(() => {
            $(this).removeClass('active-button');
        }, 100);
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

    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        $('#interval').val(interval / 1000);
    });

    chrome.storage.sync.get('maxQuality', function (data) {
        let maxQuality = data.maxQuality || '1080p';
        debugger;
        $('#max-quality').val(maxQuality);
    });

    $('#save').on('click', function () {
        let interval = parseInt($('#interval').val(), 10) * 1000;
        chrome.storage.sync.set({'checkInterval': interval}, function () {
            let maxQuality = $('#max-quality').val();
            chrome.storage.sync.set({'maxQuality': maxQuality}, function () {
                let messageDiv = $('#message');
                messageDiv.show();
                messageDiv[0].scrollIntoView({behavior: "smooth"});

                $(this).addClass('active-button');

                $('#interval').focus();

                setTimeout(() => {
                    $(this).removeClass('active-button');
                }, 100);

                setTimeout(() => {
                    window.close();
                }, 3000);
            });
        });
    });
});