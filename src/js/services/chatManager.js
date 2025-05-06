class ChatManager {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.username = 'Anonymous';
        this.chatContainer = null;
        this.messages = null;
        this.messageInput = null;
        this.sendButton = null;
        this.toggleButton = null;
    }

    async initialize() {
        await this.injectChatUI();
        this.setupEventListeners();
        // this.setupMessageHandler();
    }

    async injectChatUI() {
        let response;
        response = await fetch(chrome.runtime.getURL('src/html/chat.html'));
        const html = await response.text();
        
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstElementChild);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = chrome.runtime.getURL('src/css/chat.css');
        document.head.appendChild(link);

        this.chatContainer = document.getElementById('SF-chat-container');
        this.messages = document.getElementById('SF-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.toggleButton = document.getElementById('toggle-chat');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        this.toggleButton.addEventListener('click', () => {
            this.chatContainer.classList.toggle('collapsed');
            console.log(this.chatContainer, this.chatContainer.classList.contains('collapsed'))
            this.toggleButton.textContent = this.chatContainer.classList.contains('collapsed') ? '←' : '→';
        });
    }

    messageHandler(message) {
        if (message.type === 'chat') {
            this.displayMessage(message.username, message.text, message.timestamp);
        } else if (message.type === 'system') {
            this.displaySystemMessage(message.text);
        }
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        const message = {
            type: 'chat',
            username: this.username,
            text: text,
            timestamp: new Date().toISOString()
        };

        this.syncManager.sendMessage(message);
        this.displayMessage("you", text, message.timestamp);
        this.messageInput.value = '';
    }

    displayMessage(username, text, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const time = new Date(timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="username">${username}</div>
            <div class="text">${text}</div>
            <div class="timestamp">${time}</div>
        `;

        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    displaySystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = text;
        
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}