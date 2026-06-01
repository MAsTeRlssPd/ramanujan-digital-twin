/**
 * Chat WebSocket logic and UI interaction
 */

// Global state
let sessionId = localStorage.getItem('ramanujan_session_id');
if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('ramanujan_session_id', sessionId);
}

let ws = null;
let isStreaming = false;
let currentMessageDiv = null;
let currentContentDiv = null;

// DOM Elements
const messagesContainer = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const toggleMemoryBtn = document.getElementById('toggle-memory');
const leftSidebarPanel = document.getElementById('left-sidebar-panel');
const memoryPanel = document.getElementById('memory-panel');
const imageUpload = document.getElementById('image-upload');
const uploadBtn = document.getElementById('upload-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const sessionsContent = document.getElementById('sessions-content');

let currentImageData = null;
let currentMimeType = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadHistory();
    loadSessions();
    setupEventListeners();
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });
});

function setupEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', handleSend);
    
    // Send on Enter (but allow Shift+Enter for newlines)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Toggle sidebars
    if(toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            leftSidebarPanel.classList.toggle('collapsed');
        });
    }

    if(toggleMemoryBtn) {
        toggleMemoryBtn.addEventListener('click', () => {
            memoryPanel.classList.toggle('collapsed');
        });
    }
    
    // Image Upload
    if(uploadBtn) {
        uploadBtn.addEventListener('click', () => imageUpload.click());
    }
    
    if(imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const max_dim = 800;
                        
                        if (width > height && width > max_dim) {
                            height *= max_dim / width;
                            width = max_dim;
                        } else if (height > max_dim) {
                            width *= max_dim / height;
                            height = max_dim;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        currentImageData = canvas.toDataURL('image/jpeg', 0.8);
                        currentMimeType = 'image/jpeg';
                        imagePreview.src = currentImageData;
                        imagePreviewContainer.style.display = 'flex';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if(removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            currentImageData = null;
            currentMimeType = null;
            imagePreview.src = '';
            imagePreviewContainer.style.display = 'none';
            imageUpload.value = '';
        });
    }
    
    // New Chat
    if(newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            sessionId = crypto.randomUUID();
            localStorage.setItem('ramanujan_session_id', sessionId);
            messagesContainer.innerHTML = `<div class="message system-message"><div class="message-content">Pray, what mathematical thoughts occupy your mind today?</div></div>`;
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
            initWebSocket();
            if (window.fetchMemories) window.fetchMemories();
            loadSessions();
        });
    }
}

// WebSocket Management
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${sessionId}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to Ramanujan Digital Twin');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        setTimeout(initWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle sending messages
function handleSend() {
    const text = messageInput.value.trim();
    if ((!text && !currentImageData) || isStreaming || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Add user message to UI
    appendUserMessage(text, currentImageData);
    
    // Send via WebSocket
    ws.send(JSON.stringify({ 
        content: text,
        image_data: currentImageData,
        mime_type: currentMimeType
    }));
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();
    
    // Clear image
    if(removeImageBtn) removeImageBtn.click();
    
    // Setup for assistant reply
    prepareAssistantMessage();
}

// Handle incoming WebSocket messages
function handleIncomingMessage(data) {
    if (data.type === 'stream') {
        if (!currentContentDiv) prepareAssistantMessage();
        
        // Remove typing indicator if present
        const typingInd = currentMessageDiv.querySelector('.typing-indicator');
        if (typingInd) typingInd.remove();
        
        // Append text (we keep it as raw text during streaming, render markdown/math later or iteratively)
        // For simplicity in this demo, we just append text. A full markdown parser would be better.
        // We will just accumulate text and render math at the end for stability.
        currentContentDiv.dataset.rawText = (currentContentDiv.dataset.rawText || '') + data.content;
        
        // Basic formatting for streaming display (newlines)
        currentContentDiv.innerHTML = formatTextBasic(currentContentDiv.dataset.rawText);
        scrollToBottom();
        
    } else if (data.type === 'sources') {
        appendSources(data.content);
        
    } else if (data.type === 'end') {
        isStreaming = false;
        // Final render with KaTeX
        if (currentContentDiv && window.renderMathInElement) {
            // First basic markdown to HTML conversion (simple version)
            let finalHtml = currentContentDiv.dataset.rawText;
            finalHtml = parseBasicMarkdown(finalHtml);
            currentContentDiv.innerHTML = finalHtml;
            
            // Render Math
            renderMathInElement(currentContentDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
        currentContentDiv = null;
        currentMessageDiv = null;
        
        // Refresh memory panel after a short delay to let backend process extraction
        setTimeout(() => {
            if (window.fetchMemories) window.fetchMemories();
        }, 3000);
        
    } else if (data.type === 'error') {
        isStreaming = false;
        if (currentContentDiv) {
            currentContentDiv.innerHTML = `<span style="color: red;">${data.content}</span>`;
        }
    }
}

// UI Helpers
function appendUserMessage(text, imageData = null) {
    const div = document.createElement('div');
    div.className = 'message user-message';
    let html = `<div class="message-content">`;
    if (text) {
        html += `${escapeHTML(text).replace(/\n/g, '<br>')}`;
    }
    if (imageData) {
        html += `<img src="${imageData}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">`;
    }
    html += `</div>`;
    div.innerHTML = html;
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function prepareAssistantMessage() {
    isStreaming = true;
    currentMessageDiv = document.createElement('div');
    currentMessageDiv.className = 'message assistant-message';
    
    currentContentDiv = document.createElement('div');
    currentContentDiv.className = 'message-content';
    currentContentDiv.dataset.rawText = '';
    
    // Add typing indicator
    currentContentDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    currentMessageDiv.appendChild(currentContentDiv);
    messagesContainer.appendChild(currentMessageDiv);
    scrollToBottom();
}

function appendSources(sources) {
    if (!sources || sources.length === 0 || !currentMessageDiv) return;
    
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources-container';
    
    // Deduplicate sources by name
    const uniqueSources = [...new Set(sources.map(s => s.source))];
    
    let html = '<span>Grounded in:</span>';
    uniqueSources.forEach(src => {
        const cleanName = src.replace('.md', '').replace(/_/g, ' ');
        html += `
            <div class="source-tag" title="Relevance score: ${(sources.find(s=>s.source===src).relevance * 100).toFixed(0)}%">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                ${cleanName}
            </div>
        `;
    });
    
    sourcesDiv.innerHTML = html;
    currentMessageDiv.appendChild(sourcesDiv);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Very basic markdown parser for the demo
function parseBasicMarkdown(text) {
    let html = escapeHTML(text);
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Paragraphs / Newlines (if not inside pre)
    html = html.split('\n\n').map(p => {
        if(p.startsWith('<pre>')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    
    return html;
}

function formatTextBasic(text) {
    return escapeHTML(text).replace(/\n/g, '<br>');
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Fetch history
async function loadHistory() {
    try {
        const res = await fetch(`/api/history/${sessionId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                // Clear existing default message
                messagesContainer.innerHTML = '';
                
                data.history.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = `message ${msg.role}-message`;
                    div.innerHTML = `<div class="message-content">${parseBasicMarkdown(msg.content)}</div>`;
                    messagesContainer.appendChild(div);
                    
                    if (msg.role === 'assistant' && window.renderMathInElement) {
                        renderMathInElement(div.querySelector('.message-content'), {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false}
                            ],
                            throwOnError: false
                        });
                    }
                });
                scrollToBottom();
            }
        }
    } catch (e) {
        console.error("Failed to load history:", e);
    }
}

// Load past sessions for sidebar
async function loadSessions() {
    if(!sessionsContent) return;
    try {
        const res = await fetch(`/api/sessions`);
        if (res.ok) {
            const data = await res.json();
            if (data.sessions && data.sessions.length > 0) {
                sessionsContent.innerHTML = '';
                data.sessions.forEach(session => {
                    const div = document.createElement('div');
                    div.className = `session-item ${session.session_id === sessionId ? 'active' : ''}`;
                    const date = new Date(session.created_at).toLocaleString();
                    const summary = session.summary || 'New Conversation';
                    div.innerHTML = `
                        <div class="session-date">${date}</div>
                        <div class="session-summary">${escapeHTML(summary)}</div>
                    `;
                    div.addEventListener('click', () => {
                        sessionId = session.session_id;
                        localStorage.setItem('ramanujan_session_id', sessionId);
                        
                        // Reconnect ws and load history
                        if (ws) {
                            ws.onclose = null;
                            ws.close();
                        }
                        initWebSocket();
                        loadHistory();
                        if (window.fetchMemories) window.fetchMemories();
                        loadSessions(); // Re-render to update active state
                    });
                    sessionsContent.appendChild(div);
                });
            }
        }
    } catch (e) {
        console.error("Failed to load sessions:", e);
    }
}
