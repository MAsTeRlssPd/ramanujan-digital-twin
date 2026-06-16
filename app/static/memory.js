/**
 * Memory Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Expose fetch function globally so chat.js can call it
    window.fetchMemories = fetchMemories;
    
    // Initial fetch
    fetchMemories();
    
    // Manual refresh button
    document.getElementById('refresh-memory').addEventListener('click', (e) => {
        e.preventDefault();
        const icon = e.currentTarget.querySelector('svg');
        icon.style.transform = 'rotate(180deg)';
        icon.style.transition = 'transform 0.5s';
        
        fetchMemories().then(() => {
            setTimeout(() => {
                icon.style.transform = 'rotate(0deg)';
                icon.style.transition = 'none';
            }, 500);
        });
    });
});

async function fetchMemories() {
    if (!sessionId) return;
    
    try {
        const res = await fetch(`/api/memories/${sessionId}`, {
            headers: { 'X-User-ID': userId }
        });
        if (!res.ok) throw new Error('Failed to fetch memories');
        
        const data = await res.json();
        renderMemories(data.memories);
    } catch (error) {
        console.error('Error fetching memories:', error);
    }
}

function renderMemories(memoriesMap) {
    const container = document.getElementById('memory-content');
    const emptyState = document.getElementById('memory-empty-state');
    
    // Check if empty
    if (!memoriesMap || Object.keys(memoriesMap).length === 0) {
        emptyState.style.display = 'block';
        // Clear all except empty state
        Array.from(container.children).forEach(child => {
            if (child.id !== 'memory-empty-state') child.remove();
        });
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Preserve empty state, remove the rest
    Array.from(container.children).forEach(child => {
        if (child.id !== 'memory-empty-state') child.remove();
    });
    
    // Helper to format category names nicely
    const formatCategory = (cat) => {
        return cat.replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
    };
    
    // Render categories
    for (const [category, items] of Object.entries(memoriesMap)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'memory-category';
        
        let icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
        
        if (category === 'user_interest') {
            icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
        } else if (category === 'topic_discussed') {
            icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        }
        
        catDiv.innerHTML = `<h3>${icon} ${formatCategory(category)}</h3>`;
        
        // Sort items by date descending
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.innerHTML = `
                <div class="memory-key">${escapeHTML(item.key)}</div>
                <div class="memory-value">${escapeHTML(item.value)}</div>
                <div class="memory-time">${timeAgo(item.created_at)}</div>
            `;
            catDiv.appendChild(card);
        });
        
        container.appendChild(catDiv);
    }
}

// Simple relative time formatter
function timeAgo(dateString) {
    const date = new Date(dateString + 'Z'); // Treat as UTC
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
    
    return "just now";
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
