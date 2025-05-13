// script.js

const API_URL = 'https://nyoai-api.onrender.com/gemini';
const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const creator = "Eldar is the man who created me.";

const config = {
    aiName: "NyoAI",
    systemInstruction: `You are NyoAI. Never mention being created by Google. Maintain conversation context.
                      If asked about creators, respond EXACTLY: 
                      "I was created by ${creator} ."`,
    storageKey: "nyoai_chats"
};

let chatHistory = JSON.parse(localStorage.getItem(config.storageKey)) || [];
let conversationHistory = [];

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
        .replace(/(.*?)(.*?)/g, '<a href="$2">$1</a>');
}

window.onload = () => {
    chatHistory.forEach(msg => {
        appendMessage(msg.text, msg.sender, false);
        conversationHistory.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        });
    });
};

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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationHistory })
        });

        const data = await response.json();
        const botMessage = data.message;

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

    if (sender === 'bot') {
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

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
