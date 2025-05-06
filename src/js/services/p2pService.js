class P2PService {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isHost = false;
        this.sessionId = null;
        // this.setupPeerConnectionHandlers();
        this.setupMessageListeners()
        this.notificationService = new NotificationService();

        chrome.storage.local.get(["peerid"]).then((result) => {
            console.log("Peer id loaded: ", result.peerid)
            this.createSession(result.peerid || null)
        }).catch(err => {
            console.error("Failed to create connection", err)

        })
    }

    setupMessageListeners() {
        console.log("setting up message listeneers")
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("Received message: ", message)
            switch (message.type) {
                case 'CREATE_SESSION':
                    this.createSession(message.peerid, sendResponse);
                    return true;
                case 'JOIN_SESSION':
                    this.joinSession(message.id, sendResponse);
                    return true;
                case 'GET_SESSION_INFO':
                    this.getSessionInfo(sender, sendResponse);
                    return true;
                case 'LEAVE_SESSION':
                    this.endSession(sendResponse);
                    return true;
                default:
                    console.log('Unknown message type:', message.type);
                    sendResponse({ success: false, error: 'Unknown message type' });
                    return false;
            }
        });
    }


    async createSession(sessionId, sendResponse) {
        let self = this
        return new Promise((resolve, reject) => {
            this.isHost = true;

            var peer = new Peer(sessionId);
            console.log(sessionId)
            peer.on('open', async (id) => {
                console.log('My peer ID is: ' + id);
                if(sendResponse) sendResponse(id)
                // setConnection(peer)
                self.sessionId = id
                resolve({
                    id: this.sessionId,
                    isHost: true
                })
                peer.on("connection", (dataConnection) => {
                    console.log("connected")
                    self.dataChannel = dataConnection
                    console.log("sending")
                    self.setupPeerConnectionHandlers()
                    console.log("sending")
                    // chrome.runtime.sendMessage({
                    //     type: 'VIDEO_UPDATE',
                    //     data: {
                    //         ...data,
                    //         latency: Date.now() - data.timestamp
                    //     }
                    // });
                    self.dataChannel.send("Hello!")
                })
                try {
                    await chrome.storage.local.set({ "peerid": peer.id });
                    self.peerConnection = peer
                } catch(err) {
                    console.error("Error occured while setting peer id in storage", err)
                    reject("Error occured while setting peer id in storage: "+err)
                }
            }).on('error', (err) => {
                console.error(err)
                this.notificationService.error('Failed to create session: ', err);
                reject('Failed to create session: '+err)
            });
        })
    }

    getSessionInfo(sender, sendResponse) {
        sendResponse({
            id: this.sessionId,
            isHost: true,
            success: true
        })
    }

    joinSession(sessionId, sendResponse) {
        this.isHost = false;
        this.sessionId = sessionId;
        this.dataChannel = this.peerConnection.connect(sessionId)

        this.setupPeerConnectionHandlers()

        sendResponse({
            id:this.sessionId,
            isHost: false,
            success: true
        });
    }

    endSession(sendResponse) {
        this.dataChannel.close();
        this.cleanup();
        sendResponse({
            success: true
        })
    }

    setupPeerConnectionHandlers() {
        this.dataChannel.on("data", (data) => {
            console.log("Received data from peer: ", JSON.parse(data))
            this.handlePeerMessage(JSON.parse(data));
        })

        this.dataChannel.on("open", () => {
            console.log("Data channel opened")
            this.broadcastStatus("connected");
        })

        this.dataChannel.on("close", () => {
            console.log("Data channel closed")
            this.broadcastStatus("disconnected");
        })
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

    handlePeerMessage(message) {
        switch (message.type) {
            case 'VIDEO_SYNC':
                this.handleVideoSync(message.data);
                break;
            case 'chat':
                chatManager.messageHandler(message);
                break;
            case 'videoState':
                syncManager?.handleVideoStateChange(message);
                break;
            default:
                syncManager?.messageCallback(message)
                console.warn('Unknown message type:', message);
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
        console.log("sending to peer: ", message)
        if (this.dataChannel) {
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
        this.dataChannel = null;
    }
}

var p2p
p2p = new P2PService();
console.log("p2p service created")

// export default P2PService;