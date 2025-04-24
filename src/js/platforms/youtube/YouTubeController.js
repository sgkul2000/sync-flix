import VideoController from '../base/videocontroller.js';

class YouTubeController extends VideoController {
    constructor() {
        super();
        this.videoSelector = '.html5-main-video';
        this.playerSelector = '#movie_player';
    }

    initialize() {
        return new Promise((resolve) => {
            const checkVideo = setInterval(() => {
                const video = document.querySelector(this.videoSelector);
                const player = document.querySelector(this.playerSelector);
                if (video && player) {
                    clearInterval(checkVideo);
                    this.videoElement = video;
                    this.player = player;
                    this.setupYouTubeSpecificControls();
                    this.isReady = true;
                    resolve(true);
                }
            }, 1000);
        });
    }

    setupYouTubeSpecificControls() {
        const originalPlay = this.videoElement.play.bind(this.videoElement);
        this.videoElement.play = () => {
            originalPlay();
            this.syncWithYouTubeUI(true);
        };

        const originalPause = this.videoElement.pause.bind(this.videoElement);
        this.videoElement.pause = () => {
            originalPause();
            this.syncWithYouTubeUI(false);
        };

        // Add quality sync
        this.setupQualitySync();
        // Add playback speed sync
        this.setupPlaybackSpeedSync();
        // Add subtitle sync
        this.setupSubtitleSync();
    }

    setupQualitySync() {
        const qualityMenu = document.querySelector('.ytp-settings-button');
        if (qualityMenu) {
            qualityMenu.addEventListener('click', () => {
                const quality = this.getCurrentQuality();
                this.syncManager?.sendMessage({
                    type: 'quality',
                    value: quality
                });
            });
        }
    }

    setupPlaybackSpeedSync() {
        const speedObserver = new MutationObserver(() => {
            const speed = this.videoElement.playbackRate;
            this.syncManager?.sendMessage({
                type: 'playbackSpeed',
                value: speed
            });
        });

        speedObserver.observe(this.videoElement, {
            attributes: true,
            attributeFilter: ['playbackRate']
        });
    }

    setupSubtitleSync() {
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        if (subtitleButton) {
            subtitleButton.addEventListener('click', () => {
                const subtitleState = this.getSubtitleState();
                this.syncManager?.sendMessage({
                    type: 'subtitles',
                    value: subtitleState
                });
            });
        }
    }

    getCurrentQuality() {
        const qualityLabel = document.querySelector('.ytp-quality-menu .ytp-menuitem[aria-checked="true"]');
        return qualityLabel ? qualityLabel.textContent : 'auto';
    }

    setQuality(quality) {
        const qualityButton = document.querySelector('.ytp-settings-button');
        if (qualityButton) {
            qualityButton.click();
            setTimeout(() => {
                const qualityMenu = document.querySelector(`.ytp-quality-menu .ytp-menuitem[aria-label="${quality}"]`);
                if (qualityMenu) {
                    qualityMenu.click();
                }
            }, 100);
        }
    }

    getSubtitleState() {
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        return subtitleButton ? subtitleButton.getAttribute('aria-pressed') === 'true' : false;
    }

    setSubtitleState(enabled) {
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        const currentState = this.getSubtitleState();
        if (subtitleButton && currentState !== enabled) {
            subtitleButton.click();
        }
    }

    setPlaybackSpeed(speed) {
        if (this.videoElement) {
            this.videoElement.playbackRate = speed;
        }
    }

    // Volume sync
    setVolume(volume) {
        if (this.videoElement) {
            this.videoElement.volume = volume;
            this.videoElement.muted = volume === 0;
        }
    }

    getVolume() {
        return this.videoElement ? this.videoElement.volume : 1;
    }
}

export default YouTubeController;