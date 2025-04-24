class NotificationManager {
    constructor(containerId = 'notificationContainer') {
        this.container = this.createContainer(containerId);
        this.notifications = new Map();
        this.setupStyles();
    }

    createContainer(id) {
        let container = document.getElementById(id);
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 16px;
                right: 16px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 320px;
            }

            .notification {
                padding: 12px 16px;
                border-radius: 6px;
                color: white;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .notification.info { background: #2196F3; }
            .notification.success { background: #4CAF50; }
            .notification.warning { background: #FFC107; color: #000; }
            .notification.error { background: #F44336; }

            .notification-close {
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                font-size: 18px;
                line-height: 1;
            }

            .notification-close:hover {
                opacity: 1;
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    show(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.innerHTML = `
            <div class="notification-content">${notification.message}</div>
            <div class="notification-close">×</div>
        `;

        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(notification.id));

        this.container.appendChild(element);
        this.notifications.set(notification.id, {
            element,
            timeout: setTimeout(() => this.dismiss(notification.id), notification.duration)
        });
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        clearTimeout(notification.timeout);
        notification.element.style.animation = 'slideOut 0.3s ease forwards';
        
        setTimeout(() => {
            notification.element.remove();
            this.notifications.delete(id);
        }, 300);
    }
}

export default NotificationManager;