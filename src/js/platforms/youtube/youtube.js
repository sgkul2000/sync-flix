console.log('YouTube Sync Extension loaded');
var syncManager;
var chatManager
async function initializeYouTubeSync() {
    const controller = new YouTubeController();
    await controller.initialize();

    syncManager = new SyncManager();

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
    
    chatManager = new ChatManager(syncManager);
    await chatManager.initialize();

    // Assign syncManager to controller for message sending
    controller.syncManager = syncManager;

    // Handle sync messages
    syncManager.setMessageCallback((message) => {
        switch (message.type) {
            case 'subtitles':
                controller.setSubtitleState(message.value);
                break;
        }
    });

    // Handle ad breaks
    controller.videoElement.addEventListener('timeupdate', async () => {
        const adOverlay = document.querySelector('.ytp-ad-player-overlay');
        if (adOverlay) {
            await controller.handleAdBreak();
            // Resync after ad
            syncManager.requestSync();
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

    // Handle YouTube's native player state changes
    document.addEventListener('yt-player-updated', () => {
        console.log("YT Internal event caught", controller.isPlaying())
        // if (controller.isPlaying()) {
        //     controller.syncWithYouTubeUI(true);
        // } else {
        //     controller.syncWithYouTubeUI(false);
        // }
    });

    // Add volume sync
    controller.videoElement.addEventListener('volumechange', () => {
        const volume = controller.getVolume();
        console.log("volume changed: ", volume)
        syncManager.sendMessage({
            type: 'volume',
            value: volume
        });
    });
}

initializeYouTubeSync();