// Check and adjust the quality of the Vimeo video (vimeo.com and embedded players)
window.checkAndAdjustVimeoVideoQuality = function () {
    window.checkAndAdjustMenuPlayerQuality({
        getSettingsButton: () => $('[data-prefs-button]').first(),
        isMenuOpen: () => $('[data-prefs-button]').first().attr('aria-expanded') === 'true',
        // The quality entry is the one showing a resolution as its current value, e.g. "Quality 720p"
        getQualityMenuItem: () => {
            const menuItems = $('[data-menu="prefs"] [role="menuitem"]');
            const withResolution = menuItems.filter(function () {
                return /\d{3,4}p/.test($(this).text());
            });
            return (withResolution.length ? withResolution : menuItems).first();
        },
        getQualityOptions: () => $('[data-menu="prefs"] [role="menuitemradio"][data-id]'),
        // Entries are identified as "1080p", "720p", ... and "auto"
        getResolution: option => {
            const resolution = /^(\d{3,4})p$/.exec(option.attr('data-id'));
            return resolution ? parseInt(resolution[1], 10) : null;
        },
        getLabel: option => option.attr('data-id'),
        isSelected: option => option.attr('aria-checked') === 'true',
        select: option => option.click(),
        getVideoFrame: () => $('.player').first()
    });
};
