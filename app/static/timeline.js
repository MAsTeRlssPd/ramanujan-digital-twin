/**
 * Ramanujan Life Timeline Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchTimeline();
});

async function fetchTimeline() {
    try {
        const res = await fetch('/api/timeline');
        if (res.ok) {
            const data = await res.json();
            renderTimeline(data.timeline);
        }
    } catch (error) {
        console.error('Failed to load timeline:', error);
    }
}

function renderTimeline(timelineData) {
    const container = document.getElementById('timeline-content');
    container.innerHTML = '<div class="timeline-container"></div>';
    const tlContainer = container.querySelector('.timeline-container');
    
    timelineData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.dataset.category = item.category;
        
        div.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-year">${item.year}</div>
                <div class="timeline-event">${item.event}</div>
            </div>
        `;
        
        tlContainer.appendChild(div);
    });
}
