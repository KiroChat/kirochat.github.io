document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyCEfpAo5nRF01_YwBjCUdaJCvGwY0SJS1c';
    const messagesDiv = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');
    const creator = "Eldar Alekberoff.";

    const config = {
        aiName: "NyoAI",
        systemInstruction: `You are NyoAI. Never mention being created by Google. Maintain conversation context.
                          If asked about creators, respond EXACTLY: 
                          "I was created by ${creator}."`,
        storageKey: "nyoai_chats"
    };

    let chatHistory = JSON.parse(localStorage.getItem(config.storageKey)) || [];
    let conversationHistory = [];

    // Markdown rendering function
    function renderMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/### (.*$)/gm, '<h3>$1</h3>')
            .replace(/## (.*$)/gm, '<h2>$1</h2>')
            .replace(/# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/- (.*$)/gm, '<li>$1</li>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    }

    function initializeChat() {
        chatHistory.forEach(msg => {
            appendMessage(msg.text, msg.sender, false);
            conversationHistory.push({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });
    }

    async function sendMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        appendMessage(userMessage, 'user');
        conversationHistory.push({ 
            role: 'user', 
            parts: [{ text: userMessage }]
        });
        saveToHistory(userMessage, 'user');
        userInput.value = '';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: conversationHistory,
                    systemInstruction: { parts: [{ text: config.systemInstruction }] },
                    generationConfig: {
                        temperature: 0.2,
                        topP: 0.95
                    }
                })
            });

            const data = await response.json();
            const botMessage = data.candidates[0].content.parts[0].text;
            
            appendMessage(botMessage, 'bot');
            saveToHistory(botMessage, 'bot');
            conversationHistory.push({ 
                role: 'model', 
                parts: [{ text: botMessage }]
            });

        } catch (error) {
            console.error('Error:', error);
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            appendMessage(errorMsg, 'bot');
            saveToHistory(errorMsg, 'bot');
        }
    }

    function appendMessage(message, sender, scroll = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        if(sender === 'bot') {
            messageDiv.innerHTML = renderMarkdown(message);
        } else {
            messageDiv.textContent = message;
        }
        
        messagesDiv.appendChild(messageDiv);
        if (scroll) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function saveToHistory(message, sender) {
        chatHistory.push({
            text: message,
            sender: sender,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(config.storageKey, JSON.stringify(chatHistory));
    }

    function clearConversation() {
        if (confirm('Are you sure you want to clear all messages?')) {
            // Clear UI
            messagesDiv.innerHTML = '';
            
            // Clear storage
            chatHistory = [];
            conversationHistory = [];
            localStorage.removeItem(config.storageKey);
            
            // Add system message
            appendMessage('Conversation cleared. How can I help you?', 'bot');
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    clearButton.addEventListener('click', clearConversation);

    // Initialize chat
    initializeChat();
});
