document.addEventListener('DOMContentLoaded', function () {
    // Load saved interval when popup opens
    chrome.storage.sync.get('checkInterval', function (data) {
        let interval = data.checkInterval || 15000;
        document.getElementById('interval').value = interval / 1000;
    });

    document.getElementById('save').addEventListener('click', function () {
        let interval = parseInt(document.getElementById('interval').value, 10) * 1000;
        chrome.storage.sync.set({ 'checkInterval': interval }, function () {
            let messageDiv = document.getElementById('message');
            messageDiv.style.display = "block";

            setTimeout(() => {
                window.close(); // Simply close the popup after 3 seconds
            }, 3000); // Wait 3 seconds before closing
        });
    });
});
