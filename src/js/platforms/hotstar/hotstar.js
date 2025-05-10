console.log("Hotstar Sync Extension loaded")
var syncManager;
var chatManager
async function initializeHotstarSync() {
    const controller = new HotstarController();
    await controller.initialize();

    syncManager = new SyncManager();

    // Listen for background service messages

    console.log("here")
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
    //         case 'audioTrack':
    //             controller.setAudioTrack(message.value);
    //             break;
    //     }
    // });

    // Handle ad breaks
    controller.videoElement.addEventListener('timeupdate', async () => {
        const adContainer = document.querySelector('.ad-container');
        if (adContainer && adContainer.style.display !== 'none') {
            await controller.handleAdBreak();
            syncManager.requestSync();
        }
    });

    // Listen for messages from popup
    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //     if (message.type === 'SESSION_CREATED') {
    //         syncManager.initialize(true, controller.videoElement);
    //     } else if (message.type === 'SESSION_JOINED') {
    //         syncManager.initialize(false, controller.videoElement);
    //     }
    // });
}

initializeHotstarSync();