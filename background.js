// import P2PService from './src/js/services/p2pService.js';

class BackgroundService {
    constructor() {
        // this.p2pService = new P2PService();
        this.activeSessions = new Map();
        this.setupMessageListeners();
    }

    setupMessageListeners() {
        // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        //     switch (message.type) {
        //         // case 'CREATE_SESSION':
        //         //     // this.handleCreateSession(sender.tab?.id, message.data, sendResponse);
        //         //     return true;
        //         case 'SIGNAL':
        //             this.handleSignal(message.data, sender.tab?.id);
        //             return true;
        //         // case 'JOIN_SESSION':
        //         //     this.handleJoinSession(sender.tab?.id, message.data, sendResponse);
        //         //     return true;
        //         // case 'END_SESSION':
        //         //     this.handleEndSession(sender.tab?.id, sendResponse);
        //         //     return true;
        //         // case 'GET_SESSION_INFO':
        //         //     this.handleGetSessionInfo(sender.tab?.id, sendResponse);
        //         //     return true;
        //         default:
        //             console.log('Unknown message type:', message.type);
        //             sendResponse({ success: false, error: 'Unknown message type' });
        //             return false;
        //     }
        // });
    }

    // Session Management
    async handleCreateSession(tabId, data, sendResponse) {
        const sessionId = this.generateSessionId();
        this.activeSessions.set(sessionId, {
            host: tabId,
            participants: [tabId],
            created: Date.now()
        });
        sendResponse({ success: true, sessionId });
    }

    async handleJoinSession(tabId, data, sendResponse) {
        const session = this.activeSessions.get(data.sessionId);
        if (!session) {
            sendResponse({ success: false, error: 'Session not found' });
            return;
        }
        session.participants.push(tabId);
        this.broadcastSessionUpdate(data.sessionId);
        sendResponse({ success: true, sessionId: data.sessionId });
    }

    handleSignal(data, tabId) {
        const session = this.activeSessions.get(data.sessionId);
        if (session) {
            session.participants.forEach(participantId => {
                if (participantId !== tabId) {
                    chrome.tabs.sendMessage(participantId, {
                        type: 'SIGNAL',
                        data: data
                    });
                }
            });
        }
    }

    handleEndSession(tabId, sendResponse) {
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.host === tabId) {
                this.activeSessions.delete(sessionId);
                this.saveSessions();
                this.notifySessionEnd(session.participants, sessionId);
                sendResponse({ success: true });
                return;
            }
        }
        sendResponse({ success: false, error: 'Session not found' });
    }

    handleTabClose(tabId) {
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.host === tabId) {
                this.activeSessions.delete(sessionId);
                this.notifySessionEnd(session.participants, sessionId);
            } else if (session.participants.includes(tabId)) {
                session.participants = session.participants.filter(id => id !== tabId);
                this.broadcastSessionUpdate(sessionId);
            }
        }
        this.saveSessions();
    }

    broadcastSessionUpdate(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        session.participants.forEach(tabId => {
            chrome.tabs.sendMessage(tabId, {
                type: 'SESSION_UPDATE',
                data: {
                    sessionId,
                    participantCount: session.participants.length,
                    isHost: session.host === tabId
                }
            });
        });
    }

    notifySessionEnd(participants, sessionId) {
        participants.forEach(tabId => {
            chrome.tabs.sendMessage(tabId, {
                type: 'SESSION_ENDED',
                data: { sessionId }
            });
        });
    }

    handleGetSessionInfo(tabId, sendResponse) {
        try {
            console.log('handleGetSessionInfo called');
            console.log('tabId:', tabId);

            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (session.participants.includes(tabId)) {
                    sendResponse({
                        success: true,
                        session: {
                            id: sessionId,
                            participantCount: session.participants.length,
                            isHost: session.host === tabId
                        }
                    });
                    return;
                }
            }
            sendResponse({ success: false });
        } catch (error) {
            console.error('Get session info error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }
}

// Remove duplicate class declaration and P2PService import
const backgroundService = new BackgroundService();
