$(document).ready(function () {
    $('#donateBtn').on('click', function () {
        let qrCode = $('#donate-qr');
        qrCode.toggle();
    });

    // Load saved interval when popup opens
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        $('#interval').val(interval / 1000);
    });

    $('#save').on('click', function () {
        let interval = parseInt($('#interval').val(), 10) * 1000;
        chrome.storage.sync.set({ 'checkInterval': interval }, function () {
            let messageDiv = $('#message');
            messageDiv.show();
            messageDiv[0].scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
                window.close();
            }, 3000);
        });
    });
});