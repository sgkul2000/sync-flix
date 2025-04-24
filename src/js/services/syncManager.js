import WebRTCService from './webrtc.js';

class SyncManager {
    constructor() {
        this.webrtc = new WebRTCService();
        this.videoPlayer = null;
        this.syncThreshold = 2000;
        this.sessionId = null;
        this.isHost = false;
    }

    async initialize(isInitiator, videoPlayer) {
        this.videoPlayer = videoPlayer;
        
        // Get current session info from background
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SESSION_INFO'
        });

        if (response.success) {
            this.sessionId = response.session.id;
            this.isHost = response.session.isHost;
        }

        this.webrtc.initializeConnection(isInitiator);
        this.setupMessageHandling();
        this.setupVideoListeners();
    }

    async createSession(platform) {
        const response = await chrome.runtime.sendMessage({
            type: 'CREATE_SESSION',
            data: { platform }
        });

        if (response.success) {
            this.sessionId = response.sessionId;
            this.isHost = true;
            return this.sessionId;
        }
        throw new Error('Failed to create session');
    }

    async joinSession(sessionId) {
        const response = await chrome.runtime.sendMessage({
            type: 'JOIN_SESSION',
            data: { sessionId }
        });

        if (response.success) {
            this.sessionId = sessionId;
            this.isHost = false;
            return true;
        }
        throw new Error('Failed to join session');
    }

    async endSession() {
        if (this.isHost && this.sessionId) {
            await chrome.runtime.sendMessage({
                type: 'END_SESSION'
            });
            this.sessionId = null;
            this.isHost = false;
        }
    }

    setupMessageHandling() {
        this.webrtc.setMessageCallback((message) => {
            if (message.type === 'videoState') {
                this.handleVideoStateChange(message);
            }
        });
    }

    setupVideoListeners() {
        this.videoPlayer.addEventListener('play', () => {
            this.webrtc.sendVideoState('play', this.videoPlayer.currentTime);
        });

        this.videoPlayer.addEventListener('pause', () => {
            this.webrtc.sendVideoState('pause', this.videoPlayer.currentTime);
        });

        this.videoPlayer.addEventListener('seeked', () => {
            this.webrtc.sendVideoState('seek', this.videoPlayer.currentTime);
        });
    }

    handleVideoStateChange(message) {
        const { action, timestamp } = message;
        
        switch (action) {
            case 'play':
                if (Math.abs(this.videoPlayer.currentTime - timestamp) > this.syncThreshold / 1000) {
                    this.videoPlayer.currentTime = timestamp;
                }
                this.videoPlayer.play();
                break;
            
            case 'pause':
                this.videoPlayer.pause();
                break;
            
            case 'seek':
                this.videoPlayer.currentTime = timestamp;
                break;
        }
    }

    // Methods for connection establishment
    async createConnection() {
        const offer = await this.webrtc.createOffer();
        return offer;
    }

    async joinConnection(offer) {
        const answer = await this.webrtc.handleOffer(offer);
        return answer;
    }

    async completeConnection(answer) {
        await this.webrtc.handleAnswer(answer);
    }

    handleIceCandidate(candidate) {
        this.webrtc.addIceCandidate(candidate);
    }

    async createSession() {
        const offer = await this.createConnection();
        this.sessionId = this.generateSessionId();
        const sessionData = {
            offer,
            sessionId: this.sessionId
        };
        return btoa(JSON.stringify(sessionData));
    }

    async joinSession(sessionString) {
        try {
            const sessionData = JSON.parse(atob(sessionString));
            this.sessionId = sessionData.sessionId;
            const answer = await this.joinConnection(sessionData.offer);
            return btoa(JSON.stringify({ answer, sessionId: this.sessionId }));
        } catch (error) {
            throw new Error('Invalid session data');
        }
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }
}

export default SyncManager;