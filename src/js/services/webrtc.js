class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
        this.onMessageCallback = null;
    }

    async initializeConnection(isInitiator) {
        this.isInitiator = isInitiator;
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        this.setupPeerConnectionListeners();

        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel('syncChannel');
            this.setupDataChannel();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }
    }

    setupPeerConnectionListeners() {
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send the ICE candidate to the peer via your signaling method
                this.onIceCandidate(event.candidate);
            }
        };
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel is open');
        };

        this.dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.onMessageCallback) {
                this.onMessageCallback(message);
            }
        };
    }

    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async handleOffer(offer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async addIceCandidate(candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    sendMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    setMessageCallback(callback) {
        this.onMessageCallback = callback;
    }

    // Video sync specific methods
    sendVideoState(action, timestamp) {
        this.sendMessage({
            type: 'videoState',
            action: action, // 'play', 'pause', 'seek'
            timestamp: timestamp
        });
    }

    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }
}

export default WebRTCService;