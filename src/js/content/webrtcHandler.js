class WebRTCHandler {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.sessionId = null;
        this.isHost = false;
        
        this.setupMessageListener();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'INIT_WEBRTC') {
                this.initializeWebRTC(message.data);
                sendResponse({ success: true });
            }
            return true;
        });
    }
    
    async initializeWebRTC(data) {
        this.sessionId = data.sessionId;
        this.isHost = data.isHost;
        
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        if (this.isHost) {
            this.dataChannel = this.peerConnection.createDataChannel('syncChannel');
            this.setupDataChannelHandlers();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannelHandlers();
            };
        }
        
        // Send connection status to background
        this.sendStatusUpdate('connecting');
    }
    
    setupDataChannelHandlers() {
        this.dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handlePeerMessage(message);
        };

        this.dataChannel.onopen = () => {
            console.log('P2P Connection established');
            this.sendStatusUpdate('connected');
        };

        this.dataChannel.onclose = () => {
            console.log('P2P Connection closed');
            this.sendStatusUpdate('disconnected');
        };
    }
    
    handlePeerMessage(message) {
        // Forward message to background script
        chrome.runtime.sendMessage({
            type: 'PEER_MESSAGE',
            data: message
        });
    }
    
    sendStatusUpdate(status) {
        chrome.runtime.sendMessage({
            type: 'CONNECTION_STATUS',
            status: status
        });
    }
}

// Initialize the handler
const webrtcHandler = new WebRTCHandler();