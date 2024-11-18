// Constants and Configuration
const CONFIG = {
    ANIMATION_DURATION: 300,
    STATUS: {
        NOT_STARTED: 'Not Started',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed'
    },
    CLASSES: {
        NOT_STARTED: 'not-started',
        IN_PROGRESS: 'in-progress',
        COMPLETED: 'completed'
    }
};

// Theme Management
const ThemeManager = {
    toggle() {
        document.body.classList.toggle('dark-theme');
        const btn = document.querySelector('.theme-btn');
        btn.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        
        // Save preference
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    },

    init() {
        // Load saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.querySelector('.theme-btn').textContent = '☀️';
        }
    }
};

// Phase Management
const PhaseManager = {
    expandPhase(element) {
        const phase = element.closest('.phase');
        const expandIcon = element.querySelector('.expand-icon');
        const wasExpanded = phase.classList.contains('expanded');

        if (!wasExpanded) {
            // Save scroll position
            const scrollPosition = window.scrollY;

            // Expand the phase
            phase.classList.add('expanded');
            expandIcon.textContent = '−';

            // Restore scroll position
            window.scrollTo(0, scrollPosition);

            // Track expansion state
            localStorage.setItem(`phase-${phase.dataset.phase}-expanded`, 'true');
        }
    },

    collapsePhase(element) {
        const phase = element.closest('.phase');
        const expandIcon = element.querySelector('.expand-icon');
        
        phase.classList.remove('expanded');
        expandIcon.textContent = '+';
        
        // Track collapse state
        localStorage.removeItem(`phase-${phase.dataset.phase}-expanded`);
    },

    togglePhaseDetails(event, btn) {
        event.stopPropagation();
        const wasExpanded = btn.closest('.phase').classList.contains('expanded');
        
        if (wasExpanded) {
            this.collapsePhase(btn);
        } else {
            this.expandPhase(btn);
        }
    }
};

// Progress Tracking
const ProgressTracker = {
    calculatePhaseProgress(phase) {
        const tasks = phase.querySelectorAll('input[type="checkbox"]');
        const completedTasks = Array.from(tasks).filter(task => task.checked).length;
        return {
            completed: completedTasks,
            total: tasks.length,
            percentage: (completedTasks / tasks.length) * 100
        };
    },

    updatePhaseProgress(phase) {
        const progress = this.calculatePhaseProgress(phase);
        
        // Update phase statistics
        phase.querySelector('.completed-tasks').textContent = 
            `${progress.completed}/${progress.total} tasks`;

        // Update time remaining
        const timeRemaining = phase.querySelector('.time-remaining');
        const totalWeeks = parseInt(timeRemaining.dataset.totalWeeks || 4);
        const remainingWeeks = Math.ceil(totalWeeks * (1 - progress.completed / progress.total));
        timeRemaining.textContent = `${remainingWeeks} weeks`;

        // Update status button based on progress
        this.updatePhaseStatus(phase, progress);

        // Save progress
        this.saveProgress(phase);
    },

    updateTotalProgress() {
        const phases = document.querySelectorAll('.phase');
        let totalTasks = 0;
        let completedTasks = 0;

        phases.forEach(phase => {
            const progress = this.calculatePhaseProgress(phase);
            totalTasks += progress.total;
            completedTasks += progress.completed;
        });

        const totalProgress = Math.round((completedTasks / totalTasks) * 100);
        
        // Update progress bar and text
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        
        progressBar.style.width = `${totalProgress}%`;
        progressText.textContent = `${totalProgress}% Complete`;

        // Save total progress
        localStorage.setItem('totalProgress', totalProgress);
    },

    updatePhaseStatus(phase, progress) {
        const statusBtn = phase.querySelector('.status-btn');
        
        if (progress.completed === 0) {
            this.setStatus(statusBtn, CONFIG.STATUS.NOT_STARTED);
        } else if (progress.completed === progress.total) {
            this.setStatus(statusBtn, CONFIG.STATUS.COMPLETED);
        } else {
            this.setStatus(statusBtn, CONFIG.STATUS.IN_PROGRESS);
        }
    },

    setStatus(btn, status) {
        btn.textContent = status;
        btn.className = `status-btn ${CONFIG.CLASSES[status.replace(/\s+/g, '_').toUpperCase()]}`;
    },

    saveProgress(phase) {
        const phaseId = phase.dataset.phase;
        const tasks = phase.querySelectorAll('input[type="checkbox"]');
        
        const progressData = Array.from(tasks).map(task => ({
            id: task.id,
            checked: task.checked
        }));

        localStorage.setItem(`phase-${phaseId}-progress`, JSON.stringify(progressData));
    },

    loadProgress() {
        document.querySelectorAll('.phase').forEach(phase => {
            const phaseId = phase.dataset.phase;
            const savedProgress = localStorage.getItem(`phase-${phaseId}-progress`);
            
            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                progressData.forEach(task => {
                    const checkbox = document.getElementById(task.id);
                    if (checkbox) {
                        checkbox.checked = task.checked;
                    }
                });
                this.updatePhaseProgress(phase);
            }
        });
    }
};

// Task Management
const TaskManager = {
    toggleStatus(event, btn) {
        event.stopPropagation();
        const currentStatus = btn.textContent;
        const statusValues = Object.values(CONFIG.STATUS);
        const currentIndex = statusValues.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusValues.length;
        
        ProgressTracker.setStatus(btn, statusValues[nextIndex]);
        ProgressTracker.updateTotalProgress();
    }
};

// Bulk Actions
function expandAllPhases() {
    document.querySelectorAll('.phase').forEach(phase => {
        const expandBtn = phase.querySelector('.expand-btn');
        PhaseManager.expandPhase(expandBtn);
    });
}

function collapseAllPhases() {
    document.querySelectorAll('.phase').forEach(phase => {
        const expandBtn = phase.querySelector('.expand-btn');
        PhaseManager.collapsePhase(expandBtn);
    });
}

// Animation Management
const AnimationManager = {
    init() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate__fadeInLeft');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.phase').forEach(phase => {
            observer.observe(phase);
        });
    }
};

// Event Listeners
function setupEventListeners() {
    // Task checkbox changes
    document.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' && e.target.closest('.tasks')) {
            const phase = e.target.closest('.phase');
            ProgressTracker.updatePhaseProgress(phase);
            ProgressTracker.updateTotalProgress();
        }
    });

    // Phase expansion state persistence
    window.addEventListener('beforeunload', () => {
        document.querySelectorAll('.phase').forEach(phase => {
            if (phase.classList.contains('expanded')) {
                localStorage.setItem(`phase-${phase.dataset.phase}-expanded`, 'true');
            }
        });
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ProgressTracker.loadProgress();
    AnimationManager.init();
    setupEventListeners();

    // Restore expansion states
    document.querySelectorAll('.phase').forEach(phase => {
        const phaseId = phase.dataset.phase;
        if (localStorage.getItem(`phase-${phaseId}-expanded`) === 'true') {
            const expandBtn = phase.querySelector('.expand-btn');
            PhaseManager.expandPhase(expandBtn);
        }
    });
});

// Export functions for global use
window.toggleTheme = ThemeManager.toggle;
window.togglePhaseDetails = (event, btn) => PhaseManager.togglePhaseDetails(event, btn);
window.toggleStatus = (event, btn) => TaskManager.toggleStatus(event, btn);
window.expandAllPhases = expandAllPhases;
window.collapseAllPhases = collapseAllPhases;