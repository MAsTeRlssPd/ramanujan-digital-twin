/**
 * Chat WebSocket logic and UI interaction
 */

// Global state
let sessionId = localStorage.getItem('ramanujan_session_id');
if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('ramanujan_session_id', sessionId);
}

let userId = localStorage.getItem('ramanujan_user_id');
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('ramanujan_user_id', userId);
}

let ws = null;
let isStreaming = false;
let currentMessageDiv = null;

// ── Voice / TTS state ──────────────────────────────────────────
let ttsVoice = null;
let ttsAutoSpeak = localStorage.getItem('ramanujan_auto_voice') === 'true';
let ttsSpeaking = false;
let currentContentDiv = null;

// ── API Key & Initialization State ───────────────────────────────
let apiKey = localStorage.getItem('ramanujan_api_key');

// DOM Elements
const landingPage = document.getElementById('landing-page');
const appContainer = document.getElementById('app-container');
const apiKeyInput = document.getElementById('api-key-input');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
const apiKeyError = document.getElementById('api-key-error');
const eyeIcon = document.getElementById('eye-icon');

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
const changeKeyBtn = document.getElementById('change-key-btn');

let currentImageData = null;
let currentMimeType = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {

    
    if (!apiKey) {
        landingPage.style.display = 'flex';
        appContainer.style.display = 'none';
        setupLandingPage();
    } else {
        landingPage.style.display = 'none';
        appContainer.style.display = 'flex';
        initializeApp();
    }
});

function setupLandingPage() {
    if (toggleKeyBtn) {
        toggleKeyBtn.addEventListener('click', () => {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
            } else {
                apiKeyInput.type = 'password';
                eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
            }
        });
    }
}

window.handleApiKeySubmit = function() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        apiKeyError.textContent = "Please enter an API key.";
        apiKeyError.style.display = 'block';
        return;
    }
    if (key.length < 20) {
        apiKeyError.textContent = "Please enter a valid Google Gemini API key.";
        apiKeyError.style.display = 'block';
        return;
    }
    
    apiKeyError.style.display = 'none';
    localStorage.setItem('ramanujan_api_key', key);
    apiKey = key;
    
    // Transition
    landingPage.style.animation = "fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
    setTimeout(() => {
        landingPage.style.display = 'none';
        appContainer.style.display = 'flex';
        appContainer.style.animation = "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        initializeApp();
    }, 300);
}

function initializeApp() {
    initWebSocket();
    loadHistory();
    loadSessions();
    setupEventListeners();
    initTTS();
    
    if (changeKeyBtn) {
        changeKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('ramanujan_api_key');
            location.reload();
        });
    }
    
    // Auto-resize input
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });
    
    // ── Voice Input ──────────────────────────────────────────────────────────
    const micBtn = document.getElementById('mic-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const ORIGINAL_PLACEHOLDER = 'Ask Ramanujan a mathematical question...';
    const LISTENING_PLACEHOLDER = '🎤 Listening… speak now';

    if (!SpeechRecognition) {
        if (micBtn) micBtn.style.display = 'none';
    } else {
        let recognition = null;
        let micActive = false;   // our single source of truth
        let accumulated = '';   // confirmed words so far

        function buildRecognition() {
            const r = new SpeechRecognition();
            r.continuous = true;        // keep listening without gaps
            r.interimResults = true;
            r.maxAlternatives = 3;      // consider more hypotheses for better accuracy
            r.lang = 'en-IN';           // Indian English

            r.onstart = () => {
                micBtn.classList.add('listening');
                messageInput.placeholder = LISTENING_PLACEHOLDER;
            };

            r.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    // Pick the best alternative (index 0 has highest confidence)
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        accumulated += (accumulated && !accumulated.endsWith(' ') ? ' ' : '') + t.trim();
                    } else {
                        interim += t;
                    }
                }
                messageInput.value = accumulated + (interim ? (accumulated ? ' ' : '') + interim : '');
                messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            };

            r.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Click the 🔒 lock icon in your browser address bar and allow microphone.');
                    stopMic();
                } else if (event.error === 'audio-capture') {
                    alert('No microphone found. Please check your system settings.');
                    stopMic();
                }
                // 'no-speech' / 'aborted' / 'network' → onend will handle restart
            };

            r.onend = () => {
                if (micActive) {
                    // Browser killed continuous mode (e.g. long silence) — restart after short delay
                    setTimeout(() => {
                        if (micActive) {
                            try {
                                recognition = buildRecognition();
                                recognition.start();
                            } catch(e) { stopMic(); }
                        }
                    }, 200);
                } else {
                    // properly stopped — clean up UI
                    micBtn.classList.remove('listening');
                    messageInput.placeholder = ORIGINAL_PLACEHOLDER;
                }
            };

            return r;
        }

        function startMic() {
            micActive = true;
            accumulated = messageInput.value;
            recognition = buildRecognition();
            try { recognition.start(); } catch(e) { console.error(e); micActive = false; }
        }

        function stopMic() {
            micActive = false;  // must be set BEFORE calling stop() so onend sees it
            micBtn.classList.remove('listening');
            messageInput.placeholder = ORIGINAL_PLACEHOLDER;
            try { if (recognition) recognition.stop(); } catch(e) {}
            recognition = null;
        }

        window.stopVoiceRecording = stopMic;

        micBtn.addEventListener('click', () => {
            if (micActive) { stopMic(); } else { startMic(); }
        });
    }
    // ─────────────────────────────────────────────────────────────────────────
}

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

    // --- Mobile sidebar helpers ---
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function closeMobileSidebars() {
        if (leftSidebarPanel) leftSidebarPanel.classList.remove('mobile-open');
        if (memoryPanel) memoryPanel.classList.remove('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    function openMobileSidebar(panel) {
        closeMobileSidebars(); // close any other open sidebar first
        panel.classList.add('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    // Tap overlay → close all sidebars
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebars);
    }

    // Toggle sidebars
    if(toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (leftSidebarPanel.classList.contains('mobile-open')) {
                    closeMobileSidebars();
                } else {
                    openMobileSidebar(leftSidebarPanel);
                }
            } else {
                leftSidebarPanel.classList.toggle('collapsed');
            }
        });
    }

    if(toggleMemoryBtn) {
        toggleMemoryBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (memoryPanel.classList.contains('mobile-open')) {
                    closeMobileSidebars();
                } else {
                    openMobileSidebar(memoryPanel);
                }
            } else {
                memoryPanel.classList.toggle('collapsed');
            }
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
            const sugg = document.getElementById('suggestions-container');
            if (sugg) sugg.style.display = 'flex';
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

    // Stop voice recording if active
    if (window.stopVoiceRecording) {
        window.stopVoiceRecording();
    }

    // Add user message to UI
    appendUserMessage(text, currentImageData);
    
    const sugg = document.getElementById('suggestions-container');
    if (sugg) sugg.style.display = 'none';
    
    // Send via WebSocket
    ws.send(JSON.stringify({ 
        content: text,
        image_data: currentImageData,
        mime_type: currentMimeType,
        api_key: apiKey,
        user_id: userId
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
        if (currentMessageDiv) {
            currentMessageDiv.dataset.sources = JSON.stringify(data.content);
            // Store parsed sources for action bar rendering later
            currentMessageDiv._pendingSources = data.content;
            if (currentContentDiv) {
                renderContent(currentContentDiv, currentContentDiv.dataset.rawText);
            }
        }
        
    } else if (data.type === 'end') {
        isStreaming = false;
        const rawText = currentContentDiv ? currentContentDiv.dataset.rawText : '';
        // Final render with KaTeX and Plots
        if (currentContentDiv) {
            renderContent(currentContentDiv, currentContentDiv.dataset.rawText);
        }
        
        // Add action bar (Listen + Source links) to the completed message
        if (currentMessageDiv && rawText) {
            addActionBar(currentMessageDiv, rawText, currentMessageDiv._pendingSources || []);
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

// Global source URL map
const SOURCE_URL_MAP = {
    'book_kerala_rare_28155.md': 'https://archive.org/details/pli.kerala.rare.28155',
    'book_kerala_rare_37877.md': 'https://archive.org/details/pli.kerala.rare.37877',
    'book_srinivasa_ramanujan_biography.md': 'https://archive.org/details/srinivasaramanuj0000unse',
    'book_lost_notebook.md': 'https://archive.org/details/lost-notebook',
    'paper_ramanujan_computing_technology.md': 'https://arxiv.org/abs/2103.09654',
    'paper_lost_notebook_wiki.md': 'https://www.academia.edu/45639627/Srinivasa_Ramanujans_Lost_Notebooks',
    'paper_ramanujan_sum_wiki.md': 'https://arxiv.org/pdf/0907.5232',
    'web_wikipedia_ramanujan.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'web_ramanujan_explained.md': 'https://ramanujanexplained.org/',
    'web_ramanujan_conjecture_wiki.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'lecture_youtube_NVVhGtFVpEU.md': 'https://www.youtube.com/watch?v=NVVhGtFVpEU',
    'web_math4raghuram_videos.md': 'https://sites.google.com/site/math4raghuram/videos',
    'doc_ramanujan_legacy_documentary.md': 'https://archive.org/details/SrinivasaRamanujan-TheMathematicianandHisLegacy-20170518webm',
    'web_imsc_ramanujan.md': 'https://www.imsc.res.in/~rao/ramanujan/index.html',
    'math_partition_function.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'math_taxicab_1729.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'math_mock_theta.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'math_continued_fractions.md': 'https://ramanujanexplained.org/',
    'math_highly_composite.md': 'https://ramanujanexplained.org/',
    'math_modular_forms.md': 'https://ramanujanexplained.org/',
    'math_pi_series.md': 'https://ramanujanexplained.org/',
    'math_rogers_ramanujan.md': 'https://ramanujanexplained.org/',
    'biography_cambridge.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'biography_early_life.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'biography_illness_return.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'letter_to_hardy_1913.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
    'letter_final_mock_theta.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
};

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
    
    // Inline citations [Source X]
    html = html.replace(/\[Source\s*(\d+)\]/gi, (match, num) => {
        return `<span class="inline-citation" data-source-index="${num}">[Source ${num}]<div class="source-tooltip inline-tooltip"></div></span>`;
    });
    
    return html;
}

function formatTextBasic(text) {
    return escapeHTML(text).replace(/\n/g, '<br>');
}

// Unified rendering for Markdown, Math (KaTeX), and Plots (function-plot, Plotly)
function renderContent(element, rawText) {
    let plotConfigs = [];
    let imageTags = [];
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

    // Extract Handwriting blocks
    processedText = processedText.replace(/```handwriting\s*\n([\s\S]*?)```/gi, (match, contentStr) => {
        try {
            const id = imageTags.length;
            const escapedText = escapeHTML(contentStr.trim());
            imageTags.push(`<canvas id="hw_${uniqueId}_${id}" class="handwriting-canvas" data-text="${escapedText}" style="max-width: 100%; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); margin: 15px 0; background: #eaf0ea;"></canvas>`);
            return `HANDWRITING_PLACEHOLDER_${id}`;
        } catch (e) {
            console.error("Handwriting error", e);
            return `\`\`\`\n${contentStr}\n\`\`\``;
        }
    });

    let finalHtml = parseBasicMarkdown(processedText);
    
    // Inject tooltip data into inline citations
    try {
        const msgDiv = element.closest('.message');
        if (msgDiv && msgDiv.dataset.sources) {
            const sources = JSON.parse(msgDiv.dataset.sources);
            // We need to inject the tooltip text into the empty .source-tooltip divs we created above
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = finalHtml;
            tempDiv.querySelectorAll('.inline-citation').forEach(citeSpan => {
                const idx = parseInt(citeSpan.dataset.sourceIndex) - 1;
                if (sources[idx] && sources[idx].text) {
                    const tooltip = citeSpan.querySelector('.source-tooltip');
                    if (tooltip) {
                        const srcName = sources[idx].source;
                        
                        const SOURCE_URL_MAP = {
                            'book_kerala_rare_28155.md': 'https://archive.org/details/pli.kerala.rare.28155',
                            'book_kerala_rare_37877.md': 'https://archive.org/details/pli.kerala.rare.37877',
                            'book_srinivasa_ramanujan_biography.md': 'https://archive.org/details/srinivasaramanuj0000unse',
                            'book_lost_notebook.md': 'https://archive.org/details/lost-notebook',
                            'paper_ramanujan_computing_technology.md': 'https://arxiv.org/abs/2103.09654',
                            'web_wikipedia_ramanujan.md': 'https://en.wikipedia.org/wiki/Srinivasa_Ramanujan',
                            'web_ramanujan_explained.md': 'https://ramanujanexplained.org/',
                            'lecture_youtube_NVVhGtFVpEU.md': 'https://www.youtube.com/watch?v=NVVhGtFVpEU',
                            'web_math4raghuram_videos.md': 'https://sites.google.com/site/math4raghuram/videos',
                            'doc_ramanujan_legacy_documentary.md': 'https://archive.org/details/SrinivasaRamanujan-TheMathematicianandHisLegacy-20170518webm',
                            'web_imsc_ramanujan.md': 'https://www.imsc.res.in/~rao/ramanujan/index.html'
                        };
                        
                        const realUrl = SOURCE_URL_MAP[srcName] || `/api/corpus/${srcName}`;
                        const readMoreLink = `<div style="margin-top: 10px; text-align: right; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; pointer-events: auto;"><a href="${realUrl}" target="_blank" style="color: #ffcc00; text-decoration: underline; font-weight: bold; font-size: 0.9rem; cursor: pointer; display: inline-block;">View Original Source ↗</a></div>`;
                        tooltip.innerHTML = escapeHTML(sources[idx].text) + readMoreLink;
                    }
                }
            });
            finalHtml = tempDiv.innerHTML;
        }
    } catch(e) { console.error('Citation parse error', e); }
    
    // Inject placeholder divs for plots
    plotConfigs.forEach((_, index) => {
        finalHtml = finalHtml.replace(`PLOT_PLACEHOLDER_${index}`, `<div class="plot-container" id="plot-${uniqueId}-${index}" style="margin: 15px 0; background: white; border-radius: 8px; padding: 10px; overflow: hidden; display: flex; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`);
    });
    
    // Inject handwriting image tags
    imageTags.forEach((imgTag, index) => {
        finalHtml = finalHtml.replace(`HANDWRITING_PLACEHOLDER_${index}`, imgTag);
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

    // Initialize handwriting canvases
    element.querySelectorAll('canvas.handwriting-canvas').forEach(canvas => {
        if (!canvas.dataset.rendered) {
            const text = canvas.dataset.text;
            // Unescape text (basic unescape)
            const unescapedText = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
            
            // If streaming, just draw static immediately. Otherwise animate.
            animateHandwritingCanvas(canvas, unescapedText, !isStreaming);
            canvas.dataset.rendered = "true";
        }
    });

    // Add event delegation for inline citations so tooltips work reliably
    // We attach it to the parent element so it survives re-renders
    if (!element.dataset.citationListenerAttached) {
        element.addEventListener('click', (e) => {
            // If they clicked the Read Full Source link, let it open normally
            if (e.target.closest('a')) return;
            
            // If they clicked the citation span itself, toggle it
            const citeSpan = e.target.closest('.inline-citation');
            if (citeSpan) {
                // Close others first
                element.querySelectorAll('.inline-citation.show-tooltip').forEach(el => {
                    if (el !== citeSpan) el.classList.remove('show-tooltip');
                });
                citeSpan.classList.toggle('show-tooltip');
                e.preventDefault();
            } else {
                // Clicking anywhere else closes all tooltips
                element.querySelectorAll('.inline-citation.show-tooltip').forEach(el => el.classList.remove('show-tooltip'));
            }
        });
        element.dataset.citationListenerAttached = 'true';
    }
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function animateHandwritingCanvas(canvas, text, animate = true) {
    const ctx = canvas.getContext('2d');
    
    // Set fixed width, calculate dynamic height based on text lines
    const width = 600;
    const padding = 40;
    const lineHeight = 38;
    
    // We must set the font first to measure text
    ctx.font = '28px "Caveat", cursive, sans-serif';
    
    // Handle manual newlines and word wrapping
    const rawLines = text.split('\n');
    const lines = [];
    
    for (const rawLine of rawLines) {
        const words = rawLine.split(' ');
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            let testLine = currentLine + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > width - (padding * 2) && i > 0) {
                lines.push(currentLine.trim());
                currentLine = words[i] + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());
    }
    
    const height = Math.max((lines.length * lineHeight) + (padding * 2), 200);
    canvas.width = width;
    canvas.height = height;
    
    // Draw paper background (Pale greenish/grayish like Image 1)
    ctx.fillStyle = '#eaf0ea'; 
    ctx.fillRect(0, 0, width, height);
    
    // Add some noise/texture to paper
    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
    
    // Draw grid (square graph paper style)
    ctx.strokeStyle = 'rgba(120, 150, 140, 0.25)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    
    // Prepare character drawing data
    const charsToDraw = [];
    ctx.font = '28px "Caveat", cursive, sans-serif'; 
    ctx.fillStyle = '#2c3539';
    ctx.textBaseline = 'bottom';
    
    lines.forEach((line, lineIndex) => {
        let currentX = 0;
        const lineAngle = (Math.random() - 0.5) * 0.02; // very slight line slant
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const metrics = ctx.measureText(char);
            
            // Random jitters for realistic human feel
            const yJitter = (Math.random() - 0.5) * 4;
            const xJitter = (Math.random() - 0.5) * 1.5;
            const rotation = (Math.random() - 0.5) * 0.05 + lineAngle;
            const scale = 0.95 + (Math.random() * 0.1);
            
            charsToDraw.push({
                char: char,
                x: currentX + xJitter,
                y: lineIndex * lineHeight + yJitter,
                rotation: rotation,
                scale: scale,
                lineIndex: lineIndex
            });
            
            currentX += metrics.width;
            
            // Add a little extra random space between words
            if (char === ' ') {
                currentX += Math.random() * 4;
            }
        }
    });

    let drawIndex = 0;
    
    function drawNextChars() {
        if (drawIndex >= charsToDraw.length) return;
        
        // Draw 1-3 characters per frame to simulate varying writing speed
        const charsThisFrame = Math.floor(Math.random() * 3) + 1;
        
        ctx.font = '28px "Caveat", cursive, sans-serif'; 
        ctx.fillStyle = '#2c3539';
        ctx.textBaseline = 'bottom';
        
        for (let i = 0; i < charsThisFrame && drawIndex < charsToDraw.length; i++) {
            const c = charsToDraw[drawIndex++];
            if (c.char.trim() === '') continue; // Skip spaces visually
            
            ctx.save();
            ctx.translate(padding + c.x, padding + c.y);
            ctx.rotate(c.rotation);
            ctx.scale(c.scale, c.scale);
            ctx.fillText(c.char, 0, 0);
            ctx.restore();
        }
        
        if (drawIndex < charsToDraw.length) {
            requestAnimationFrame(drawNextChars);
        }
    }

    if (animate) {
        drawNextChars();
    } else {
        // Draw everything instantly
        charsThisFrame = charsToDraw.length; // Max
        while(drawIndex < charsToDraw.length) {
            const c = charsToDraw[drawIndex++];
            if (c.char.trim() === '') continue;
            
            ctx.save();
            ctx.translate(padding + c.x, padding + c.y);
            ctx.rotate(c.rotation);
            ctx.scale(c.scale, c.scale);
            ctx.fillText(c.char, 0, 0);
            ctx.restore();
        }
    }
}

// Fetch history
async function loadHistory() {
    try {
        const res = await fetch(`/api/history/${sessionId}`, {
            headers: { 'X-User-ID': userId }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                // Clear existing default message
                messagesContainer.innerHTML = '';
                const sugg = document.getElementById('suggestions-container');
                if (sugg) sugg.style.display = 'none';
                
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
        const res = await fetch(`/api/sessions`, {
            headers: { 'X-User-ID': userId }
        });
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
                        <div class="session-info">
                            <div class="session-date">${date}</div>
                            <div class="session-summary">${escapeHTML(summary)}</div>
                        </div>
                        <div class="session-actions">
                            <button class="rename-session-btn" title="Rename Conversation" data-id="${session.session_id}" data-name="${escapeHTML(summary)}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button class="delete-session-btn" title="Delete Conversation" data-id="${session.session_id}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `;
                    
                    // Click handler for the item (not the buttons)
                    div.querySelector('.session-info').addEventListener('click', () => {
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
                    
                    // Rename Handler
                    div.querySelector('.rename-session-btn').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const newName = prompt("Enter a new name for this conversation:", session.summary || '');
                        if (newName && newName.trim()) {
                            try {
                                await fetch(`/api/sessions/${session.session_id}/name`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-User-ID': userId
                                    },
                                    body: JSON.stringify({name: newName})
                                });
                                loadSessions();
                            } catch(err) { console.error("Failed to rename:", err); }
                        }
                    });
                    
                    // Delete Handler
                    div.querySelector('.delete-session-btn').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this conversation? This will permanently erase the chat history and any associated memories Ramanujan formed during it.")) {
                            try {
                                await fetch(`/api/sessions/${session.session_id}`, { 
                                    method: 'DELETE',
                                    headers: { 'X-User-ID': userId }
                                });
                                if (sessionId === session.session_id) {
                                    newChatBtn.click(); // Reset if deleted current
                                } else {
                                    loadSessions();
                                }
                            } catch(err) { console.error("Failed to delete:", err); }
                        }
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
        
        // Log all voices for debugging
        console.log('Available TTS voices:', voices.map(v => `${v.name} (${v.lang}) ${v.localService ? '[local]' : '[remote]'}`));
        
        // Prioritize Indian English (en-IN) Male voices for Ramanujan
        const priorities = [
            // 1. Microsoft Ravi (en-IN, male)
            v => /ravi/i.test(v.name) && v.lang.startsWith('en'),
            // 2. Any en-IN Male voice (Android/iOS/Chrome)
            v => v.lang === 'en-IN' && /male/i.test(v.name) && !/female/i.test(v.name),
            // 3. Any en-IN voice that doesn't explicitly sound female
            v => v.lang === 'en-IN' && !/female|woman|zira|eva|neerja|susan|hazel|veena/i.test(v.name),
            // 4. Any en-GB Male voice (British accent fallback)
            v => v.lang === 'en-GB' && /male/i.test(v.name) && !/female/i.test(v.name),
            // 5. Google UK English Male (Chrome)
            v => /Google UK English Male/i.test(v.name),
            // 6. Microsoft David (en-US, male)
            v => /david/i.test(v.name) && v.lang.startsWith('en'),
            // 7. Microsoft Mark (en-US, male)
            v => /mark/i.test(v.name) && v.lang.startsWith('en'),
            // 8. Any male voice in English
            v => v.lang.startsWith('en') && /male/i.test(v.name) && !/female/i.test(v.name),
            // 9. Any English voice that is explicitly NOT female
            v => v.lang.startsWith('en') && !/female|woman|zira|eva|neerja|susan|hazel|veena/i.test(v.name),
            // 10. Absolute fallback: any English voice
            v => v.lang.startsWith('en')
        ];
        
        for (const test of priorities) {
            const match = voices.find(test);
            if (match) { ttsVoice = match; break; }
        }
        
        if (!ttsVoice && voices.length > 0) ttsVoice = voices[0];
        if (ttsVoice) {
            console.log('✅ TTS voice selected:', ttsVoice.name, '(' + ttsVoice.lang + ')');
        } else {
            console.warn('⚠️ No TTS voices available');
        }
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
    ttsQueue = [];
    speechSynthesis.cancel();
    
    const clean = stripForSpeech(rawText);
    console.log('TTS clean text length:', clean.length, 'preview:', clean.substring(0, 100));
    if (!clean) return;
    
    ttsQueue = splitIntoChunks(clean);
    console.log('TTS chunks:', ttsQueue.length);
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
    
    // CRITICAL: Chromium's cancel() is async. We MUST wait before calling speak()
    // otherwise the new utterance gets silently swallowed.
    setTimeout(() => {
        speakNextChunk();
    }, 120);
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
    utterance.lang = ttsVoice ? ttsVoice.lang : 'en-IN';  // Ensure Indian English pronunciation
    utterance.rate = 0.88;    // Slightly slower for clear, measured delivery
    utterance.pitch = 0.9;    // Slightly deeper, warm male tone
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
    if ('speechSynthesis' in window) {
        if (speechSynthesis.speaking || speechSynthesis.pending) {
            speechSynthesis.cancel();
        }
        // Sometimes the engine gets stuck in 'paused' state, resume clears it
        if (speechSynthesis.paused) speechSynthesis.resume();
    }
    
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
 * Add an action bar with Listen button + Source link pills to an assistant message.
 */
function addActionBar(messageDiv, rawText, sources) {
    const bar = document.createElement('div');
    bar.className = 'message-action-bar';
    bar.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);';
    
    // Listen button
    if ('speechSynthesis' in window) {
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
        
        bar.appendChild(btn);
    }
    
    // Source link pills (right beside Listen)
    if (sources && sources.length > 0) {
        const uniqueSources = [...new Set(sources.map(s => s.source))];
        // Deduplicate by URL too
        const seenUrls = new Set();
        
        uniqueSources.forEach(src => {
            const realUrl = SOURCE_URL_MAP[src] || `/api/corpus/${src}`;
            if (seenUrls.has(realUrl)) return;
            seenUrls.add(realUrl);
            
            const cleanName = (src || "Unknown").replace('.md', '').replace(/_/g, ' ');
            
            const link = document.createElement('a');
            link.href = realUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'source-link-pill';
            link.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> ${cleanName}`;
            
            bar.appendChild(link);
        });
    } else {
        // Debug fallback to prove rendering works even if sources is empty
        const link = document.createElement('a');
        link.className = 'source-link-pill';
        link.style.opacity = '0.5';
        link.title = 'No sources were retrieved for this response';
        link.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> No Sources`;
        bar.appendChild(link);
    }
    
    messageDiv.appendChild(bar);
}

// Keep backward compat for history loading
function addVoiceButton(messageDiv, rawText) {
    addActionBar(messageDiv, rawText, []);
}
