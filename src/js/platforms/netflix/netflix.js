import NetflixController from './NetflixController.js';
import SyncManager from '../../services/syncManager.js';
import ChatManager from '../../services/chatManager.js';
var syncManager;
var chatManager
async function initializeNetflixSync() {
    const controller = new NetflixController();
    await controller.initialize();

    syncManager = new SyncManager();


    syncManager.initialize(false, controller.videoElement);
    
    chatManager = new ChatManager(syncManager);
    await chatManager.initialize();

    controller.syncManager = syncManager;

    // Handle sync messages
    // syncManager.setMessageCallback((message) => {
    //     switch (message.type) {
    //         case 'quality':
    //             controller.setQuality(message.value);
    //             break;
    //         case 'subtitles':
    //             controller.setSubtitleState(message.value);
    //             break;
    //     }
    // });

    // Listen for messages from popup
    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //     if (message.type === 'SESSION_CREATED') {
    //         syncManager.initialize(true, controller.videoElement);
    //     } else if (message.type === 'SESSION_JOINED') {
    //         syncManager.initialize(false, controller.videoElement);
    //     }
    // });
}

initializeNetflixSync();