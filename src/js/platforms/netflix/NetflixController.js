import VideoController from '../base/VideoController.js';

class NetflixController extends VideoController {
    constructor() {
        super();
        this.videoSelector = '.VideoContainer video';
        this.playerContainer = '.watch-video';
    }

    initialize() {
        return new Promise((resolve) => {
            const checkVideo = setInterval(() => {
                const video = document.querySelector(this.videoSelector);
                if (video) {
                    clearInterval(checkVideo);
                    this.videoElement = video;
                    this.setupNetflixSpecificControls();
                    this.isReady = true;
                    resolve(true);
                }
            }, 1000);
        });
    }

    setupNetflixSpecificControls() {
        // Override Netflix's native controls
        const originalPlay = this.videoElement.play.bind(this.videoElement);
        this.videoElement.play = () => {
            originalPlay();
            this.syncWithNetflixUI(true);
        };

        const originalPause = this.videoElement.pause.bind(this.videoElement);
        this.videoElement.pause = () => {
            originalPause();
            this.syncWithNetflixUI(false);
        };
    }

    syncWithNetflixUI(isPlaying) {
        const playButton = document.querySelector('.button-nfplayerPlay');
        const pauseButton = document.querySelector('.button-nfplayerPause');
        
        if (isPlaying) {
            pauseButton?.classList.remove('hide');
            playButton?.classList.add('hide');
        } else {
            playButton?.classList.remove('hide');
            pauseButton?.classList.add('hide');
        }
    }

    // Netflix-specific method to handle scrubber interactions
    handleScrubberChange(time) {
        const scrubber = document.querySelector('.scrubber-head');
        if (scrubber) {
            const duration = this.getDuration();
            const percentage = (time / duration) * 100;
            scrubber.style.left = `${percentage}%`;
        }
    }
}

export default NetflixController;