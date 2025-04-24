class P2PService {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isHost = false;
        this.sessionId = null;
        this.setupMessageHandlers();
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SIGNAL') {
                this.handleSignalingMessage(message.data);
            }
        });
    }

    async createSession() {
        this.isHost = true;
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.setupPeerConnectionHandlers();
        this.dataChannel = this.peerConnection.createDataChannel('syncChannel');
        this.setupDataChannelHandlers();

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        return {
            offer: offer,
            isHost: true
        };
    }

    async joinSession(sessionId, offer) {
        this.isHost = false;
        this.sessionId = sessionId;
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.setupPeerConnectionHandlers();

        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannelHandlers();
        };

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        return {
            answer: answer,
            isHost: false
        };
    }

    setupPeerConnectionHandlers() {
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                chrome.runtime.sendMessage({
                    type: 'SIGNAL',
                    data: {
                        type: 'ICE_CANDIDATE',
                        candidate: event.candidate,
                        sessionId: this.sessionId
                    }
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            this.broadcastStatus(this.peerConnection.connectionState);
        };
    }

    setupDataChannelHandlers() {
        this.dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handlePeerMessage(message);
        };

        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.broadcastStatus('connected');
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.broadcastStatus('disconnected');
        };
    }

    handleSignalingMessage(data) {
        switch (data.type) {
            case 'OFFER':
                this.handleOffer(data.offer);
                break;
            case 'ANSWER':
                this.handleAnswer(data.answer);
                break;
            case 'ICE_CANDIDATE':
                this.handleIceCandidate(data.candidate);
                break;
        }
    }

    async handleOffer(offer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        chrome.runtime.sendMessage({
            type: 'SIGNAL',
            data: {
                type: 'ANSWER',
                answer: answer,
                sessionId: this.sessionId
            }
        });
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    handlePeerMessage(message) {
        switch (message.type) {
            case 'VIDEO_SYNC':
                this.handleVideoSync(message.data);
                break;
            case 'CHAT':
                this.handleChat(message.data);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    handleVideoSync(data) {
        chrome.runtime.sendMessage({
            type: 'VIDEO_UPDATE',
            data: {
                ...data,
                latency: Date.now() - data.timestamp
            }
        });
    }

    handleChat(data) {
        chrome.runtime.sendMessage({
            type: 'CHAT_MESSAGE',
            data: data
        });
    }

    sendToPeer(message) {
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    broadcastStatus(status) {
        chrome.runtime.sendMessage({
            type: 'CONNECTION_STATUS',
            status: status
        });
    }

    cleanup() {
        this.dataChannel?.close();
        this.peerConnection?.close();
        this.dataChannel = null;
        this.peerConnection = null;
        this.isHost = false;
        this.sessionId = null;
    }
}

export default P2PService;