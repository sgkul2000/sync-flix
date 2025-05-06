class SyncManager {
    constructor() {
        // this.webrtc = new WebRTCService();
        this.videoPlayer = null;
        this.syncThreshold = 2000;
        this.sessionId = null;
        this.isHost = false;
        this.messageCallback = () => {}

        this.suppress = {
            play: false,
            pause: false,
            seek: false
        }
    }

    initialize(isInitiator, videoPlayer) {
        this.videoPlayer = videoPlayer;
        console.log("Sync manager video element: ", videoPlayer)
        
        // Get current session info from background
        this.sessionId = p2p.sessionId;
        this.isHost = true;

        // this.webrtc.initializeConnection(isInitiator);
        this.setupVideoListeners();
    }

    async sendMessage(message) {
        p2p.sendToPeer(message)
    }

    // setupMessageHandling() {
    //     // console.log("need to implement this")

    //     // this.webrtc.setMessageCallback((message) => {
    //     //     if (message.type === 'videoState') {
    //     //         this.handleVideoStateChange(message);
    //     //     }
    //     // });
    // }

    setupVideoListeners() {
        this.videoPlayer.addEventListener('play', () => {
            if(this.suppress.play) {
                this.suppress.play = false;
                return;
            }
            p2p.sendToPeer({
                type: 'videoState',
                action: 'play',
                timestamp: this.videoPlayer.currentTime
            });
        });

        this.videoPlayer.addEventListener('pause', () => {
            if(this.suppress.pause) {
                this.suppress.pause = false;
                return;
            }
            p2p.sendToPeer({
                type: 'videoState',
                action: 'pause',
                timestamp: this.videoPlayer.currentTime
            });
        });

        this.videoPlayer.addEventListener('seeked', () => {
            if(this.suppress.seek) {
                this.suppress.seek = false;
                return;
            }
            p2p.sendToPeer({
                type: 'videoState',
                action: 'seek',
                timestamp: this.videoPlayer.currentTime
            });
        });
    }

    setMessageCallback(callback) {
        this.messageCallback = callback
    }


    handleVideoStateChange(message) {
        const { action, timestamp } = message;
        
        switch (action) {
            case 'play':
                this.suppress.play = true
                if (Math.abs(this.videoPlayer.currentTime - timestamp) > this.syncThreshold / 1000) {
                    this.videoPlayer.currentTime = timestamp;
                }
                this.videoPlayer.play();
                break;
            
            case 'pause':
                this.suppress.pause = true
                this.videoPlayer.pause();
                break;
            
            case 'seek':
                this.suppress.seek = true
                this.videoPlayer.currentTime = timestamp;
                break;
        }
    }
}

