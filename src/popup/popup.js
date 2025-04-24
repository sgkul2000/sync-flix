import NotificationService from '../js/services/notificationService.js';
import NotificationManager from '../js/components/NotificationManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const popup = new PopupManager();
});

class PopupManager {
    constructor() {
        // Add new properties
        this.connectionStatus = 'disconnected';
        this.latency = 0;
        this.participants = new Map();
        
        this.currentView = 'noSession';
        this.setupEventListeners();
        this.checkCurrentSession();
        
        // Start connection monitoring
        this.startConnectionMonitoring();
        this.notificationManager = new NotificationManager();
        NotificationService.addListener((notification) => {
            this.notificationManager.show(notification);
        });
    }

    startConnectionMonitoring() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'CONNECTION_STATUS') {
                this.updateConnectionStatus(message.status, message.latency);
            } else if (message.type === 'PARTICIPANTS_UPDATE') {
                this.updateParticipants(message.participants);
            }
        });
    }

    updateConnectionStatus(status, latency) {
        this.connectionStatus = status;
        this.latency = latency;

        const dot = document.getElementById('connectionDot');
        const text = document.getElementById('connectionText');
        const latencyText = document.getElementById('latencyText');

        dot.className = `status-dot ${status}`;
        text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        latencyText.textContent = latency ? `${latency}ms` : '';
    }

    updateParticipants(participants) {
        const list = document.getElementById('participantsList');
        list.innerHTML = '';

        participants.forEach(participant => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'participant-name';
            nameDiv.textContent = participant.username;
            
            if (participant.isHost) {
                const hostBadge = document.createElement('span');
                hostBadge.className = 'host-badge';
                hostBadge.textContent = 'HOST';
                nameDiv.appendChild(hostBadge);
            }

            item.appendChild(nameDiv);
            list.appendChild(item);
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async checkCurrentSession() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Checking current session for tab:', tab); // Debug log 
        
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SESSION_INFO',
            data: { tabId: tab.id }
        });

        console.log('Check session response:', response); // Debug log

        if (response && response.success) {
            console.log('Session info:', response.session); // Debug log
            this.updateSessionInfo(response.session);
            this.showView('activeSession');
        } else {
            console.log('No active session found'); // Debug log
            this.showView('noSession');
        }
    }

    updateSessionInfo(session) {
        console.log('Updating session info:', session); // Debug log
        if (!session) return;
        
        const sessionIdElement = document.getElementById('sessionId');
        const participantCountElement = document.getElementById('participantCount');
        
        if (sessionIdElement) sessionIdElement.textContent = session.id;
        if (participantCountElement) participantCountElement.textContent = session.participantCount;
    }

    async createSession() {

        var peer = new Peer();
        peer.on('open', function(id) {
            console.log('My peer ID is: ' + id);
            this.updateSessionInfo({
                id: id,
                participantCount: 1,
                isHost: true
            });
            this.showView('activeSession');
        }).on('error', function(err) {
            NotificationService.error('Failed to create session: ', err);
        });
    }

    async checkCurrentSession() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SESSION_INFO',
            data: { tabId: tab.id }
        });

        if (response && response.success) {
            this.updateSessionInfo(response.session);
            this.showView('activeSession');
        }
    }

    // Replace showToast with this
    showNotification(message, type = 'info') {
        NotificationService[type](message);
    }

    async joinSession() {
        const sessionInput = document.getElementById('sessionInput').value.trim();
        if (!sessionInput) {
            NotificationService.error('Please enter a session ID');
            return;
        }

        try {
            const sessionId = this.extractSessionId(sessionInput);
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
            const response = await chrome.runtime.sendMessage({
                type: 'JOIN_SESSION',
                data: { 
                    sessionId,
                    tabId: tab.id
                }
            });
        
            if (response.success) {
                NotificationService.success('Successfully joined session');
                this.showView('activeSession');
            } else {
                NotificationService.error(response.error || 'Failed to join session');
            }
        } catch (error) {
            NotificationService.error('Connection error', error);
        }
    }

    // Update other methods to use NotificationService instead of showToast
    async leaveSession() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.runtime.sendMessage({
            type: 'END_SESSION',
            tabId: tab.id
        });

        this.showView('noSession');
    }

    showView(viewName) {
        const views = ['noSession', 'activeSession', 'joinSession'];
        views.forEach(view => {
            document.getElementById(`${view}View`).classList.toggle('hidden', view !== viewName);
        });
        this.currentView = viewName;
    }

    updateSessionInfo(session) {
        document.getElementById('sessionId').textContent = session.id;
        document.getElementById('participantCount').textContent = session.participantCount;
    }

    async copyInviteLink() {
        const sessionId = document.getElementById('sessionId').textContent;
        const inviteLink = `https://syncflix.app/join/${sessionId}`;
        await navigator.clipboard.writeText(inviteLink);
        
        const copyButton = document.getElementById('copyInvite');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy Invite Link';
        }, 2000);
    }

    extractSessionId(input) {
        // Handle both direct IDs and invite links
        const match = input.match(/\/join\/([a-zA-Z0-9]+)$/);
        return match ? match[1] : input;
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('createSession').addEventListener('click', () => {
            console.log('Create session clicked'); // Debug log
            this.createSession();
        });
        
        document.getElementById('joinSession').addEventListener('click', () => {
            console.log('Join session clicked'); // Debug log
            this.showView('joinSession');
        });
        
        document.getElementById('leaveSession').addEventListener('click', () => {
            console.log('Leave session clicked'); // Debug log
            this.leaveSession();
        });
        
        document.getElementById('copyInvite').addEventListener('click', () => {
            console.log('Copy invite clicked'); // Debug log
            this.copyInviteLink();
        });

        // Join session view
        document.getElementById('confirmJoin').addEventListener('click', () => {
            console.log('Confirm join clicked'); // Debug log
            this.joinSession();
        });
        
        document.getElementById('cancelJoin').addEventListener('click', () => {
            console.log('Cancel join clicked'); // Debug log
            this.showView('noSession');
        });
    }
}