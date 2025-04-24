class SessionManager {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.platform = this.detectPlatform();
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        if (hostname.includes('netflix')) return 'netflix';
        if (hostname.includes('youtube')) return 'youtube';
        if (hostname.includes('hotstar')) return 'hotstar';
        return 'unknown';
    }

    async createNewSession() {
        const sessionId = await this.syncManager.createSession(this.platform);
        const sessionUrl = this.generateSessionUrl(sessionId);
        return sessionUrl;
    }

    async joinExistingSession(sessionUrl) {
        const sessionId = this.extractSessionString(sessionUrl);
        await this.syncManager.joinSession(sessionId);
        return sessionId;
    }

    generateSessionUrl(sessionString) {
        const baseUrl = chrome.runtime.getURL('src/html/popup.html');
        return `${baseUrl}?session=${sessionString}`;
    }

    extractSessionString(sessionUrl) {
        const url = new URL(sessionUrl);
        return url.searchParams.get('session');
    }

    async completeSessionConnection(responseString) {
        const response = JSON.parse(atob(responseString));
        await this.syncManager.completeConnection(response.answer);
    }
}

export default SessionManager;