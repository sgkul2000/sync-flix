import NetflixController from './NetflixController.js';
import SyncManager from '../../services/syncManager.js';
import ChatManager from '../../services/chatManager.js';

async function initializeNetflixSync() {
    const controller = new NetflixController();
    await controller.initialize();

    const syncManager = new SyncManager();

    // Listen for background service messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'SESSION_UPDATE':
                handleSessionUpdate(message.data);
                break;
            case 'SESSION_ENDED':
                handleSessionEnd(message.data);
                break;
        }
    });

    function handleSessionUpdate(data) {
        chatManager.displaySystemMessage(
            `Session updated: ${data.participantCount} participants`
        );
    }

    function handleSessionEnd(data) {
        chatManager.displaySystemMessage('Session ended by host');
        syncManager.endSession();
    }

    syncManager.initialize(false, controller.videoElement);
    
    const chatManager = new ChatManager(syncManager);
    await chatManager.initialize();

    controller.syncManager = syncManager;

    // Handle sync messages
    syncManager.setMessageCallback((message) => {
        switch (message.type) {
            case 'quality':
                controller.setQuality(message.value);
                break;
            case 'subtitles':
                controller.setSubtitleState(message.value);
                break;
            case 'volume':
                controller.setVolume(message.value);
                break;
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SESSION_CREATED') {
            syncManager.initialize(true, controller.videoElement);
        } else if (message.type === 'SESSION_JOINED') {
            syncManager.initialize(false, controller.videoElement);
        }
    });
}

initializeNetflixSync();