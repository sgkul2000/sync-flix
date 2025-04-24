import SessionManager from './services/sessionManager.js';
import SyncManager from './services/syncManager.js';

class PopupUI {
    constructor() {
        this.syncManager = new SyncManager();
        this.sessionManager = new SessionManager(this.syncManager);
        this.username = localStorage.getItem('username');
        
        this.elements = {
            namePrompt: document.getElementById('namePrompt'),
            mainControls: document.getElementById('mainControls'),
            sessionInfo: document.getElementById('sessionInfo'),
            username: document.getElementById('username'),
            saveName: document.getElementById('saveName'),
            createSession: document.getElementById('createSession'),
            joinSession: document.getElementById('joinSession'),
            copyInvite: document.getElementById('copyInvite'),
            sessionId: document.getElementById('sessionId')
        };

        this.initializeUI();
    }

    initializeUI() {
        if (!this.username) {
            this.showNamePrompt();
        } else {
            this.showMainControls();
        }

        this.setupEventListeners();
        this.checkForSessionInUrl();
    }

    showNamePrompt() {
        this.elements.namePrompt.classList.remove('hidden');
        this.elements.mainControls.classList.add('hidden');
        this.elements.sessionInfo.classList.add('hidden');
    }

    showMainControls() {
        this.elements.namePrompt.classList.add('hidden');
        this.elements.mainControls.classList.remove('hidden');
        this.elements.sessionInfo.classList.add('hidden');
    }

    showSessionInfo(sessionUrl) {
        this.elements.namePrompt.classList.add('hidden');
        this.elements.mainControls.classList.add('hidden');
        this.elements.sessionInfo.classList.remove('hidden');
        this.elements.sessionId.textContent = `Session URL: ${sessionUrl}`;
    }

    setupEventListeners() {
        this.elements.saveName.addEventListener('click', () => {
            const name = this.elements.username.value.trim();
            if (name) {
                localStorage.setItem('username', name);
                this.username = name;
                this.showMainControls();
            }
        });

        this.elements.createSession.addEventListener('click', async () => {
            const sessionUrl = await this.sessionManager.createNewSession();
            this.showSessionInfo(sessionUrl);
        });

        this.elements.joinSession.addEventListener('click', () => {
            const sessionUrl = prompt('Enter session URL:');
            if (sessionUrl) {
                this.joinExistingSession(sessionUrl);
            }
        });

        this.elements.copyInvite.addEventListener('click', () => {
            const sessionUrl = this.elements.sessionId.textContent.split(': ')[1];
            navigator.clipboard.writeText(sessionUrl);
            this.elements.copyInvite.textContent = 'Copied!';
            setTimeout(() => {
                this.elements.copyInvite.textContent = 'Copy Invite Link';
            }, 2000);
        });
    }

    async joinExistingSession(sessionUrl) {
        try {
            const responseString = await this.sessionManager.joinExistingSession(sessionUrl);
            await this.sessionManager.completeSessionConnection(responseString);
            this.showSessionInfo('Connected successfully!');
        } catch (error) {
            alert('Failed to join session: ' + error.message);
        }
    }

    checkForSessionInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session');
        if (sessionParam) {
            this.joinExistingSession(window.location.href);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupUI();
});