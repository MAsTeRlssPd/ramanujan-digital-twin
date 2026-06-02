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

// ── Voice / TTS state ──────────────────────────────────────────
let ttsVoice = null;
let ttsAutoSpeak = localStorage.getItem('ramanujan_auto_voice') === 'true';
let ttsSpeaking = false;
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
    initTTS();
    
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
        const rawText = currentContentDiv ? currentContentDiv.dataset.rawText : '';
        // Final render with KaTeX and Plots
        if (currentContentDiv) {
            renderContent(currentContentDiv, currentContentDiv.dataset.rawText);
        }
        
        // Add voice button to the completed message
        if (currentMessageDiv && rawText) {
            addVoiceButton(currentMessageDiv, rawText);
            // Auto-speak if enabled
            if (ttsAutoSpeak) {
                speakText(rawText);
            }
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

// Unified rendering for Markdown, Math (KaTeX), and Plots (function-plot, Plotly)
function renderContent(element, rawText) {
    let plotConfigs = [];
    let uniqueId = Math.random().toString(36).substr(2, 9);
    
    // Extract 2D plot blocks before escaping HTML
    let processedText = rawText.replace(/```plot\s*\n([\s\S]*?)```/gi, (match, configStr) => {
        const id = plotConfigs.length;
        plotConfigs.push({type: '2d', config: configStr});
        return `PLOT_PLACEHOLDER_${id}`;
    });

    // Extract 3D plot blocks
    processedText = processedText.replace(/```plot3d\s*\n([\s\S]*?)```/gi, (match, configStr) => {
        const id = plotConfigs.length;
        plotConfigs.push({type: '3d', config: configStr});
        return `PLOT_PLACEHOLDER_${id}`;
    });

    let finalHtml = parseBasicMarkdown(processedText);
    
    // Inject placeholder divs for plots
    plotConfigs.forEach((_, index) => {
        finalHtml = finalHtml.replace(`PLOT_PLACEHOLDER_${index}`, `<div class="plot-container" id="plot-${uniqueId}-${index}" style="margin: 15px 0; background: white; border-radius: 8px; padding: 10px; overflow: hidden; display: flex; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`);
    });
    
    element.innerHTML = finalHtml;
    
    // Render Math
    if (window.renderMathInElement) {
        renderMathInElement(element, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }
    
    // Render Plots
    plotConfigs.forEach((plot, index) => {
        const targetId = `plot-${uniqueId}-${index}`;
        try {
            let config = JSON.parse(plot.config);
            if (plot.type === '2d') {
                config.target = `#${targetId}`;
                if (!config.width) config.width = 450;
                if (!config.height) config.height = 300;
                if (typeof config.grid === 'undefined') config.grid = true;
                if (window.functionPlot) {
                    window.functionPlot(config);
                }
            } else if (plot.type === '3d') {
                const targetElement = element.querySelector(`#${targetId}`);
                if (window.Plotly && window.math && targetElement) {
                    if (config.type === 'surface' && config.f) {
                        const compiledNode = window.math.compile(config.f);
                        let xRange = config.xRange || [-5, 5];
                        let yRange = config.yRange || [-5, 5];
                        let steps = 40;
                        let xStep = (xRange[1] - xRange[0]) / steps;
                        let yStep = (yRange[1] - yRange[0]) / steps;
                        
                        let x = [], y = [], z = [];
                        for (let i = 0; i <= steps; i++) {
                            let yi = yRange[0] + i * yStep;
                            y.push(yi);
                            let zRow = [];
                            for (let j = 0; j <= steps; j++) {
                                if (i === 0) x.push(xRange[0] + j * xStep);
                                let xj = xRange[0] + j * xStep;
                                try {
                                    zRow.push(compiledNode.evaluate({x: xj, y: yi}));
                                } catch(err) {
                                    zRow.push(0);
                                }
                            }
                            z.push(zRow);
                        }
                        
                        let data = [{
                            z: z,
                            x: x,
                            y: y,
                            type: 'surface',
                            colorscale: 'Viridis'
                        }];
                        
                        let layout = {
                            title: config.title || '3D Surface',
                            width: 500,
                            height: 450,
                            margin: {l: 0, r: 0, b: 0, t: 30}
                        };
                        
                        Plotly.newPlot(targetElement, data, layout);
                    }
                }
            }
        } catch (e) {
            console.error("Plot parsing error", e);
            const container = element.querySelector(`#${targetId}`);
            if(container) container.innerHTML = `<div style="color:red; padding: 10px;">Failed to render plot.</div>`;
        }
    });
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
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    div.appendChild(contentDiv);
                    messagesContainer.appendChild(div);
                    
                    renderContent(contentDiv, msg.content);
                    
                    if (msg.role === 'assistant') {
                        addVoiceButton(div, msg.content);
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

// ── Voice / TTS Engine ───────────────────────────────────────────

let ttsQueue = [];      // Queue of sentence chunks to speak
let ttsCurrentBtn = null; // Currently active speak button

function initTTS() {
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API not supported in this browser');
        const toggleBtn = document.getElementById('voice-toggle');
        if (toggleBtn) toggleBtn.style.display = 'none';
        return;
    }
    
    // Load voices (some browsers load them asynchronously)
    function pickVoice() {
        const voices = speechSynthesis.getVoices();
        if (!voices.length) return;
        
        // Priority: Indian English > British English > any English
        // Also match common Windows/Google voice names
        const priorities = [
            v => v.lang === 'en-IN',
            v => v.lang.startsWith('en-IN'),
            v => /ravi|neerja|india/i.test(v.name) && v.lang.startsWith('en'),
            v => v.lang === 'en-GB' && /male|daniel|george|ryan/i.test(v.name),
            v => v.lang === 'en-GB',
            v => v.lang.startsWith('en') && /male|david|mark|james/i.test(v.name) && !/female|zira|eva/i.test(v.name),
            v => v.lang.startsWith('en'),
        ];
        
        for (const test of priorities) {
            const match = voices.find(test);
            if (match) { ttsVoice = match; break; }
        }
        
        if (!ttsVoice) ttsVoice = voices[0];
        console.log('TTS voice selected:', ttsVoice.name, '(' + ttsVoice.lang + ')');
    }
    
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
    
    // Wire up global auto-speak toggle
    const toggleBtn = document.getElementById('voice-toggle');
    if (toggleBtn) {
        if (ttsAutoSpeak) toggleBtn.classList.add('active');
        
        toggleBtn.addEventListener('click', () => {
            ttsAutoSpeak = !ttsAutoSpeak;
            localStorage.setItem('ramanujan_auto_voice', ttsAutoSpeak);
            toggleBtn.classList.toggle('active', ttsAutoSpeak);
            
            if (!ttsAutoSpeak) stopSpeaking();
        });
    }
}

/**
 * Clean raw response text into natural, speakable sentences.
 */
function stripForSpeech(text) {
    let clean = text;
    
    // Convert common math symbols to spoken words
    clean = clean.replace(/π/g, 'pi');
    clean = clean.replace(/∞/g, 'infinity');
    clean = clean.replace(/∑/g, 'sum of');
    clean = clean.replace(/∏/g, 'product of');
    clean = clean.replace(/√/g, 'square root of');
    clean = clean.replace(/≈/g, 'approximately equals');
    clean = clean.replace(/≠/g, 'does not equal');
    clean = clean.replace(/≤/g, 'less than or equal to');
    clean = clean.replace(/≥/g, 'greater than or equal to');
    clean = clean.replace(/×/g, 'times');
    clean = clean.replace(/÷/g, 'divided by');
    
    // Read simple inline math naturally: $x = 5$ → "x equals 5"
    clean = clean.replace(/\$([^$]{1,30})\$/g, (_, expr) => {
        let readable = expr.trim();
        readable = readable.replace(/\^(\d+)/g, ' to the power $1');
        readable = readable.replace(/\^{([^}]+)}/g, ' to the power $1');
        readable = readable.replace(/_(\d)/g, ' sub $1');
        readable = readable.replace(/_{([^}]+)}/g, ' sub $1');
        readable = readable.replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2');
        readable = readable.replace(/\\sqrt{([^}]+)}/g, 'square root of $1');
        readable = readable.replace(/\\pi/g, 'pi');
        readable = readable.replace(/\\infty/g, 'infinity');
        readable = readable.replace(/\\sum/g, 'sum of');
        readable = readable.replace(/\\[a-zA-Z]+/g, ''); // strip remaining LaTeX commands
        readable = readable.replace(/[{}]/g, '');
        readable = readable.replace(/=/g, ' equals ');
        return readable;
    });
    
    // Remove complex display math blocks but acknowledge them
    clean = clean.replace(/\$\$[\s\S]*?\$\$/g, '. The following is a mathematical formula. ');
    clean = clean.replace(/\\\[[\s\S]*?\\\]/g, '. The following is a mathematical formula. ');
    clean = clean.replace(/\\\([\s\S]*?\\\)/g, '');
    
    // Remove markdown formatting but keep the text
    clean = clean.replace(/```[\s\S]*?```/g, '. ');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
    clean = clean.replace(/\*(.*?)\*/g, '$1');
    clean = clean.replace(/#{1,6}\s*/g, '');
    clean = clean.replace(/[-*]\s+/g, '. ');  // bullet points → pauses
    clean = clean.replace(/\d+\.\s+/g, '. ');  // numbered lists → pauses
    
    // Clean up whitespace and punctuation
    clean = clean.replace(/\n+/g, '. ');
    clean = clean.replace(/\.{2,}/g, '.');
    clean = clean.replace(/\.\s*\./g, '.');
    clean = clean.replace(/\s{2,}/g, ' ');
    
    return clean.trim();
}

/**
 * Split text into sentence-sized chunks.
 * Browsers cut off utterances longer than ~200-300 chars,
 * so we break at sentence boundaries.
 */
function splitIntoChunks(text) {
    // Split on sentence-ending punctuation followed by space
    const raw = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    const chunks = [];
    let current = '';
    
    for (const sentence of raw) {
        if ((current + sentence).length > 180) {
            if (current.trim()) chunks.push(current.trim());
            current = sentence;
        } else {
            current += sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    
    return chunks;
}

/**
 * Speak text aloud, sentence by sentence.
 */
function speakText(rawText, button = null) {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speech first
    stopSpeaking();
    
    const clean = stripForSpeech(rawText);
    if (!clean) return;
    
    ttsQueue = splitIntoChunks(clean);
    ttsCurrentBtn = button;
    
    if (button) {
        button.classList.add('speaking');
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Stop
        `;
    }
    
    speakNextChunk();
}

/**
 * Speak the next chunk in the queue.
 */
function speakNextChunk() {
    if (ttsQueue.length === 0) {
        finishSpeaking();
        return;
    }
    
    const chunk = ttsQueue.shift();
    if (!chunk.trim()) {
        speakNextChunk();
        return;
    }
    
    console.log('TTS Speaking:', chunk);
    
    const utterance = new SpeechSynthesisUtterance(chunk);
    // Anti-Garbage-Collection fix for Chrome/Safari
    window.currentUtterance = utterance;
    
    if (ttsVoice) utterance.voice = ttsVoice;
    utterance.rate = 0.92;    // Clear, unhurried pace
    utterance.pitch = 0.95;   // Slightly deeper tone
    utterance.volume = 1.0;
    
    utterance.onend = () => {
        // Small pause between sentences for natural flow
        setTimeout(speakNextChunk, 150);
    };
    
    utterance.onerror = (e) => {
        console.warn('TTS chunk error:', e.error);
        // Try the next chunk anyway
        setTimeout(speakNextChunk, 100);
    };
    
    speechSynthesis.speak(utterance);
}

/**
 * Stop all speech and reset UI.
 */
function stopSpeaking() {
    ttsQueue = [];
    speechSynthesis.cancel();
    
    if (ttsCurrentBtn) {
        ttsCurrentBtn.classList.remove('speaking');
        resetVoiceBtnLabel(ttsCurrentBtn);
        ttsCurrentBtn = null;
    }
    // Reset any other speaking buttons
    document.querySelectorAll('.voice-btn.speaking').forEach(b => {
        b.classList.remove('speaking');
        resetVoiceBtnLabel(b);
    });
}

function finishSpeaking() {
    if (ttsCurrentBtn) {
        ttsCurrentBtn.classList.remove('speaking');
        resetVoiceBtnLabel(ttsCurrentBtn);
        ttsCurrentBtn = null;
    }
}

function resetVoiceBtnLabel(btn) {
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        Listen
    `;
}

/**
 * Add a speak/stop button to an assistant message div.
 */
function addVoiceButton(messageDiv, rawText) {
    if (!('speechSynthesis' in window)) return;
    
    const btn = document.createElement('button');
    btn.className = 'voice-btn';
    btn.title = 'Read aloud';
    resetVoiceBtnLabel(btn);
    
    btn.addEventListener('click', () => {
        if (btn.classList.contains('speaking')) {
            stopSpeaking();
            return;
        }
        speakText(rawText, btn);
    });
    
    messageDiv.appendChild(btn);
}
