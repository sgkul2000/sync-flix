class NotificationService {
    constructor() {
        this.listeners = new Set();
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'NOTIFICATION') {
                this.showNotification(message.data);
            }
        });
    }

    showNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: data.type || 'info',
            message: data.message,
            duration: data.duration || 3000,
            timestamp: new Date(),
            dismissed: false
        };

        this.notifyListeners(notification);

        if (data.type === 'error') {
            console.error('[SyncFlix Error]:', data.message, data.error || '');
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(notification) {
        this.listeners.forEach(listener => listener(notification));
    }

    error(message, error) {
        this.showNotification({
            type: 'error',
            message,
            error,
            duration: 5000
        });
    }

    success(message) {
        this.showNotification({
            type: 'success',
            message,
            duration: 3000
        });
    }

    info(message) {
        this.showNotification({
            type: 'info',
            message,
            duration: 3000
        });
    }

    warning(message) {
        this.showNotification({
            type: 'warning',
            message,
            duration: 4000
        });
    }
}

export default new NotificationService();