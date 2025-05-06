// import NotificationService from '../js/services/notificationService.js';
import NotificationManager from '../js/components/NotificationManager.js';

var popup
var notificationService = new NotificationService
document.addEventListener('DOMContentLoaded', () => {
    popup = new PopupManager();
});

class PopupManager {
    constructor() {
        
        // Add new properties
        this.connectionStatus = 'disconnected';
        this.latency = 0;
        this.username = '';
        
        this.currentView = 'noSession';
        this.setupEventListeners();
        this.checkCurrentSession();
        
        // Start connection monitoring
        this.startConnectionMonitoring();
        this.notificationManager = new NotificationManager();
        notificationService.addListener((notification) => {
            this.notificationManager.show(notification);
        });

        this.checkCurrentSession()

        chrome.storage.local.get(["username"]).then((result) => {
            console.log("Username loaded: ", result.username)
            this.username = result.username
        }).catch(err => {
            console.error("Failed to fetch username", err)
            this.showView('noSession')
        })
    }

    startConnectionMonitoring() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'CONNECTION_STATUS') {
                this.updateConnectionStatus(message.status, message.latency);
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

    checkCurrentSession() {
        let self = this
        chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
            var activeTab = tabs[0];
            let response = await chrome.tabs.sendMessage(activeTab.id, {
                type: 'GET_SESSION_INFO',
            });
            self.updateSessionInfo({
                id: response.id,
                isHost: response.isHost
            });
            self.showView('activeSession');
        });
    }

    updateSessionInfo(session) {
        if (!session) return;
        
        const sessionIdElement = document.getElementById('sessionId');
        
        if (sessionIdElement) sessionIdElement.textContent = session.id;
    }

    async createSession(peerid) {
        let response
        let self = this
        try {
            chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
                var activeTab = tabs[0];
                response = await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'CREATE_SESSION',
                    peerid: peerid
                });
                self.updateSessionInfo({
                    id: response.id,
                    isHost: response.isHost
                });
                self.showView('activeSession');
            });
        } catch(err) {
            console.error("Failed to create session", err)
            notificationService.error('Failed to create session: ', err);
            return;
        }
    }

    // Replace showToast with this
    showNotification(message, type = 'info') {
        notificationService[type](message);
    }

    async joinSession() {
        const sessionInput = document.getElementById('sessionInput').value.trim();
        if (!sessionInput) {
            notificationService.error('Please enter a session ID');
            return;
        }

        try {
            // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
                var activeTab = tabs[0];
                let response = await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'JOIN_SESSION',
                    id: sessionInput
                });
                if (response.success) {
                    notificationService.success('Successfully joined session');
                    this.showView('joinedSession');
                    const partnersSessionIdElement = document.getElementById('counterSessionId');
                    partnersSessionIdElement.textContent = sessionInput;
                } else {
                    notificationService.error(response.error || 'Failed to join session');
                }
            });
        
        } catch (error) {
            notificationService.error('Connection error', error);
        }
    }

    // Update other methods to use notificationService instead of showToast
    async leaveSession() {
        let self = this
        try {
            // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
                var activeTab = tabs[0];
                let response = await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'LEAVE_SESSION',
                });
                notificationService.success('Session ended');
                this.showView('noSession');
            });
        
        } catch (error) {
            notificationService.error('Connection error', error);
        }

        
    }

    showView(viewName) {
        const views = ['noSession', 'activeSession', 'joinSession', "joinedSession"];
        views.forEach(view => {
            document.getElementById(`${view}View`).classList.toggle('hidden', view !== viewName);
        });
        this.currentView = viewName;
    }

    updateSessionInfo(session) {
        Array.from(document.getElementsByClassName("sessionId")).forEach(element => {
            element.textContent = session.id;
        })
    }

    async copyInviteLink() {
        const sessionId = document.getElementById('sessionId').textContent;
        await navigator.clipboard.writeText(sessionId);
        
        const copyButton = document.getElementById('copyInvite');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy Invite Link';
        }, 2000);
    }

    saveUsername() {
        const username = document.getElementById('usernameInput').value.trim();
        if (!username) {
            notificationService.error('Please enter a username');
            return;
        }
        chrome.storage.local.set({ "username": username }).then(() => {
            notificationService.success('Username saved');
            this.showView('activeSession');
        })
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    setupEventListeners() {
        // Main action buttons
        // document.getElementById('createSession').addEventListener('click', () => {
        //     console.log('Create session clicked'); // Debug log
        //     this.createSession();
        // });
        
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
            this.showView('activeSession');
        });

        document.getElementById('saveUsername').addEventListener('click', () => {
            console.log('Save username clicked'); // Debug log
            this.saveUsername()
        });
    }
}