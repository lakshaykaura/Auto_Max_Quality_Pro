document.addEventListener('DOMContentLoaded', function () {
    let donateBtn = document.getElementById('donateBtn');
    if (donateBtn) {
        donateBtn.addEventListener('click', function () {
            let qrCode = document.getElementById('donate-qr');
            qrCode.style.display = qrCode.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Load saved interval when popup opens
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 60000;
        document.getElementById('interval').value = interval / 1000;
    });

    document.getElementById('save').addEventListener('click', function () {
        let interval = parseInt(document.getElementById('interval').value, 10) * 1000;
        chrome.storage.sync.set({ 'checkInterval': interval }, function () {
            let messageDiv = document.getElementById('message');
            messageDiv.style.display = "block";
            messageDiv.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
                window.close();
            }, 3000);
        });
    });
});