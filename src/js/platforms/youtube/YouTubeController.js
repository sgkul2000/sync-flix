class YouTubeController extends VideoController {
    constructor() {
        super();
        this.videoSelector = '.html5-main-video';
        this.playerSelector = '#movie_player';
        this.suppress = {
            playbackSpeed: false,
            subtitles: false,
        }
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

    syncWithYouTubeUI(isPlaying) {
        console.log(`Syncing with YouTube UI: ${isPlaying ? 'Playing' : 'Paused'}`);
        
        // Example: Send a message to sync manager about the play/pause state
        // this.syncManager?.sendMessage({
        //     type: 'playbackState',
        //     value: isPlaying ? 'play' : 'pause'
        // });

        // Additional logic to update UI or internal state can be added here
    }

    setupYouTubeSpecificControls() {
        console.log("Setting up YouTube specific controls");
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

        // Add subtitle sync
        this.setupSubtitleSync();
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

    getSubtitleState() {
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        return subtitleButton ? subtitleButton.getAttribute('aria-pressed') === 'true' : false;
    }

    setSubtitleState(enabled) {
        console.log("in set subtitle")
        // this.suppress.subtitles = true
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        const currentState = this.getSubtitleState();
        if (subtitleButton && currentState !== enabled) {
            subtitleButton.click();
        }
    }
}