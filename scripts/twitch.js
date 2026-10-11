// Check and adjust the quality of the Twitch stream or video (twitch.tv and embedded players)
window.checkAndAdjustTwitchVideoQuality = function () {
    window.checkAndAdjustMenuPlayerQuality({
        getSettingsButton: () => $('[data-a-target="player-settings-button"]').first(),
        isMenuOpen: () => $('[data-a-target="player-settings-menu"]').length > 0,
        getQualityMenuItem: () => $('[data-a-target="player-settings-menu-item-quality"]').first(),
        getQualityOptions: () => $('[data-a-target="player-settings-submenu-quality-option"]'),
        // Entries read "1080p60 (Source)", "720p60", "480p", ... and "Auto"
        getResolution: option => {
            const resolution = /(\d{3,4})p/.exec(option.text());
            return resolution ? parseInt(resolution[1], 10) : null;
        },
        getLabel: option => option.find('label')[0].innerText.replace(/\s+/g, ' ').trim(),
        isSelected: option => option.find('input').prop('checked'),
        select: option => option.find('label')[0].click(),
        getVideoFrame: () => $('[data-a-target="video-player"]').first()
    });
};
