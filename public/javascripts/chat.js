// Chat functionality
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatPopup = document.getElementById('chatPopup');
const chatContainer = document.getElementById('chatContainer');
const closeChat = document.getElementById('closeChat');
const messageNotification = document.getElementById('messageNotification');

let unreadMessages = 0;
let isChatOpen = false;

// Function to add a message to the chat
function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-2';
    
    const messageContent = document.createElement('div');
    messageContent.className = data.type === 'system' 
        ? 'text-gray-400 text-sm italic' 
        : 'bg-zinc-700 p-2 rounded-lg inline-block max-w-[80%]';
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'font-bold text-blue-400';
    senderSpan.textContent = data.type === 'system' ? '' : `${data.sender}: `;
    
    const messageText = document.createElement('span');
    messageText.className = 'text-white';
    messageText.textContent = data.message;
    
    if (data.type !== 'system') {
        messageContent.appendChild(senderSpan);
    }
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update notification if chat is closed
    if (!isChatOpen && data.type === 'user') {
        unreadMessages++;
        updateNotification();
    }
}

// Update notification badge
function updateNotification() {
    if (unreadMessages > 0) {
        messageNotification.style.display = 'flex';
        messageNotification.textContent = unreadMessages;
    } else {
        messageNotification.style.display = 'none';
    }
}

// Handle form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    
    if (message) {
        socket.emit('chat message', message);
        chatInput.value = '';
    }
});

// Toggle chat visibility
chatPopup.addEventListener('click', () => {
    chatContainer.classList.add('active');
    chatPopup.style.display = 'none';
    isChatOpen = true;
    unreadMessages = 0;
    updateNotification();
});

closeChat.addEventListener('click', () => {
    chatContainer.classList.remove('active');
    chatPopup.style.display = 'flex';
    isChatOpen = false;
});

// Listen for chat messages
socket.on('chat message', (data) => {
    addMessage(data);
}); 