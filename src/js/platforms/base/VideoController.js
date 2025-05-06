class VideoController {
    constructor() {
        this.videoElement = null;
        this.isReady = false;
    }

    initialize() {
        throw new Error('Initialize method must be implemented');
    }

    play() {
        if (this.videoElement) {
            return this.videoElement.play();
        }
    }

    pause() {
        if (this.videoElement) {
            this.videoElement.pause();
        }
    }

    seek(time) {
        if (this.videoElement) {
            this.videoElement.currentTime = time;
        }
    }

    getCurrentTime() {
        return this.videoElement ? this.videoElement.currentTime : 0;
    }

    getDuration() {
        return this.videoElement ? this.videoElement.duration : 0;
    }

    isPlaying() {
        return this.videoElement ? 
            !this.videoElement.paused && !this.videoElement.ended : 
            false;
    }
}