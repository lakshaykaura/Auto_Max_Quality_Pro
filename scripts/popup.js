$(document).ready(function () {
    $('#donateBtn').on('click', function () {
        let qrCode = $('#donate-qr');
        qrCode.toggle();

        let otherOptionsDiv = $('div.hideOnDonate');
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

    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        $('#interval').val(interval / 1000);
    });

    $('#save').on('click', function () {
        let interval = parseInt($('#interval').val(), 10) * 1000;
        chrome.storage.sync.set({'checkInterval': interval}, function () {
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