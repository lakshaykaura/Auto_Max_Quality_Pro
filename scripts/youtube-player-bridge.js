// Runs in the page's own JavaScript world ("world": "MAIN" in manifest.json), because YouTube's player API is not
// reachable from the extension's isolated content scripts. On request it tells youtube.js two things about each player:
// which video it holds, and which quality menu entries this viewer can actually play. YouTube lists Premium-only
// entries (e.g. "1080p Premium") for everyone, and clicking one without a membership opens an upsell instead of
// changing the quality. It also sets the playback speed youtube.js asks for.
(function () {
    const PLAYER_INFO_REQUEST = 'amqp-player-info-request';
    const PLAYER_INFO_ATTRIBUTE = 'data-amqp-player-info';
    const PLAYBACK_RATE_REQUEST = 'amqp-playback-rate-request';
    const PLAYBACK_RATE_ATTRIBUTE = 'data-amqp-playback-rate';

    document.addEventListener(PLAYBACK_RATE_REQUEST, function () {
        document.querySelectorAll('.html5-video-player[' + PLAYBACK_RATE_ATTRIBUTE + ']').forEach(function (player) {
            try {
                player.setPlaybackRate(parseFloat(player.getAttribute(PLAYBACK_RATE_ATTRIBUTE)));
                // Taking the request off the player tells youtube.js that it was handled
                player.removeAttribute(PLAYBACK_RATE_ATTRIBUTE);
            } catch (e) {
                // Left in place, so youtube.js sets the speed on the video element instead
            }
        });
    });

    // Labels the player marks as playable and as not playable. An entry it says nothing about goes on neither list,
    // which youtube.js treats as a standard quality it may select and an enhanced one it may not.
    function getQualityAvailability(player) {
        const playable = [];
        const restricted = [];
        try {
            player.getAvailableQualityData().forEach(function (quality) {
                if (quality && quality.qualityLabel && quality.isPlayable === true) {
                    playable.push(quality.qualityLabel);
                } else if (quality && quality.qualityLabel && quality.isPlayable === false) {
                    restricted.push(quality.qualityLabel);
                }
            });
        } catch (e) {
            // No quality data: both lists stay empty
        }
        return { playable, restricted };
    }

    document.addEventListener(PLAYER_INFO_REQUEST, function () {
        document.querySelectorAll('.html5-video-player').forEach(function (player) {
            try {
                const videoId = player.getVideoData().video_id || null;
                player.setAttribute(PLAYER_INFO_ATTRIBUTE, JSON.stringify({ videoId, ...getQualityAvailability(player) }));
            } catch (e) {
                // Player not ready or its API changed: say nothing, so youtube.js stays on the standard qualities
                player.removeAttribute(PLAYER_INFO_ATTRIBUTE);
            }
        });
    });
})();
