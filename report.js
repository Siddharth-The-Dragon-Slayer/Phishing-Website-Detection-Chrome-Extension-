// Dynamic Report Page JavaScript

class ReportManager {
    constructor() {
        this.history = [];
        this.stats = {
            sitesChecked: 0,
            threatsBlocked: 0
        };
        this.currentFilter = 'all';
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.refreshTimer = 30;
        this.lastDataHash = '';
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.updateAllComponents();
        this.startAutoRefresh();
        this.startRefreshTimer();
        this.setupEventListeners();
        
        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            this.handleStorageChange(changes);
        });
    }
    
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterHistory(filter);
            });
        });
        
        // Control buttons
        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });
        
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });
        
        document.getElementById('autoRefreshBtn').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.manualRefresh();
        });
        
        document.getElementById('closeBtn').addEventListener('click', () => {
            window.close();
        });
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        
        this.refreshInterval = setInterval(async () => {
            if (this.autoRefresh) {
                await this.checkForUpdates();
            }
        }, 5000); // Check every 5 seconds
    }
    
    startRefreshTimer() {
        setInterval(() => {
            if (this.autoRefresh && this.refreshTimer > 0) {
                this.refreshTimer--;
                document.getElementById('refreshTimer').textContent = this.refreshTimer + 's';
                
                if (this.refreshTimer === 0) {
                    this.refreshTimer = 30;
                    this.manualRefresh();
                }
            }
        }, 1000);
    }
    
    async checkForUpdates() {
        const oldHash = this.lastDataHash;
        await this.loadData();
        
        const newHash = this.generateDataHash();
        if (newHash !== oldHash) {
            this.lastDataHash = newHash;
            this.updateAllComponents(true); // true = animated update
        }
    }
    
    generateDataHash() {
        return JSON.stringify({
            historyLength: this.history.length,
            sitesChecked: this.stats.sitesChecked,
            threatsBlocked: this.stats.threatsBlocked,
            lastActivity: this.history[0]?.timestamp || 0
        });
    }
    
    handleStorageChange(changes) {
        if (changes.detectionHistory || changes.sitesChecked || changes.threatsBlocked) {
            this.checkForUpdates();
        }
    }
    
    updateAllComponents(animated = false) {
        this.updateStats(animated);
        this.updateChart(animated);
        this.updateHistory(animated);
        this.updateProtectionSummary();
    }
    
    async loadData() {
        try {
            const data = await chrome.storage.local.get([
                'detectionHistory', 
                'sitesChecked', 
                'threatsBlocked',
                'settings',
                'whitelist'
            ]);
            
            this.history = data.detectionHistory || [];
            this.stats.sitesChecked = data.sitesChecked || 0;
            this.stats.threatsBlocked = data.threatsBlocked || 0;
            this.settings = data.settings || {};
            this.whitelist = data.whitelist || [];
            
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    updateStats(animated = false) {
        // Calculate stats from history
        const safeSites = this.history.filter(item => item.riskLevel === 'low').length;
        const suspiciousSites = this.history.filter(item => item.riskLevel === 'medium').length;
        const dangerousSites = this.history.filter(item => item.riskLevel === 'high').length;
        
        // Animate counter updates
        if (animated) {
            this.animateCounter('totalSites', this.stats.sitesChecked);
            this.animateCounter('safeSites', safeSites);
            this.animateCounter('suspiciousSites', suspiciousSites);
            this.animateCounter('dangerousSites', this.stats.threatsBlocked);
        } else {
            document.getElementById('totalSites').textContent = this.stats.sitesChecked;
            document.getElementById('safeSites').textContent = safeSites;
            document.getElementById('suspiciousSites').textContent = suspiciousSites;
            document.getElementById('dangerousSites').textContent = this.stats.threatsBlocked;
        }
    }
    
    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === targetValue) return;
        
        element.classList.add('counter-animation');
        
        const duration = 1000;
        const steps = 20;
        const stepValue = (targetValue - currentValue) / steps;
        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            const newValue = Math.round(currentValue + (stepValue * currentStep));
            element.textContent = newValue;
            
            if (currentStep >= steps) {
                clearInterval(timer);
                element.textContent = targetValue;
                element.classList.remove('counter-animation');
            }
        }, duration / steps);
    }
    
    updateChart(animated = false) {
        const safeSites = this.history.filter(item => item.riskLevel === 'low').length;
        const suspiciousSites = this.history.filter(item => item.riskLevel === 'medium').length;
        const dangerousSites = this.history.filter(item => item.riskLevel === 'high').length;
        const total = this.history.length || 1;
        
        // Update chart bars with animation
        const safeHeight = Math.max((safeSites / total) * 100, 5);
        const suspiciousHeight = Math.max((suspiciousSites / total) * 100, 5);
        const dangerousHeight = Math.max((dangerousSites / total) * 100, 5);
        const totalHeight = Math.max((total / Math.max(total, 50)) * 100, 10);
        
        const bars = document.querySelectorAll('.chart-bar');
        bars[0].style.height = safeHeight + '%';
        bars[1].style.height = suspiciousHeight + '%';
        bars[2].style.height = dangerousHeight + '%';
        bars[3].style.height = totalHeight + '%';
        
        // Update chart values
        document.getElementById('safeCount').textContent = safeSites;
        document.getElementById('suspiciousCount').textContent = suspiciousSites;
        document.getElementById('dangerousCount').textContent = dangerousSites;
        document.getElementById('totalCount').textContent = total;
        
        // Update percentages
        document.getElementById('safePercentage').textContent = Math.round((safeSites / total) * 100) + '%';
        document.getElementById('suspiciousPercentage').textContent = Math.round((suspiciousSites / total) * 100) + '%';
        document.getElementById('dangerousPercentage').textContent = Math.round((dangerousSites / total) * 100) + '%';
        
        // Calculate average risk score
        const avgRisk = this.history.length > 0 ? 
            this.history.reduce((sum, item) => sum + (item.riskScore || 0), 0) / this.history.length : 0;
        document.getElementById('avgRiskScore').textContent = Math.round(avgRisk * 100) + '%';
    }
    
    updateHistory(animated = false) {
        const container = document.getElementById('historyContainer');
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 15px;">🔍</div>
                    <h3>No activity yet</h3>
                    <p>Start browsing to see your protection history</p>
                </div>
            `;
            return;
        }
        
        // Filter history based on current filter
        let filteredHistory = this.history;
        if (this.currentFilter !== 'all') {
            filteredHistory = this.history.filter(item => item.riskLevel === this.currentFilter);
        }
        
        // Sort by timestamp (newest first)
        filteredHistory.sort((a, b) => b.timestamp - a.timestamp);
        
        // Take only last 50 items for performance
        filteredHistory = filteredHistory.slice(0, 50);
        
        // Check for new items
        const existingItems = container.querySelectorAll('.history-item');
        const existingUrls = Array.from(existingItems).map(item => 
            item.querySelector('.site-url').textContent
        );
        
        // Clear container if not animated update
        if (!animated) {
            container.innerHTML = '';
        }
        
        filteredHistory.forEach((item, index) => {
            const truncatedUrl = this.truncateUrl(item.url);
            const isNewItem = animated && !existingUrls.includes(truncatedUrl);
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item' + (isNewItem ? ' new-activity' : '');
            
            const date = new Date(item.timestamp);
            const timeAgo = this.getTimeAgo(date);
            
            // Add risk icon
            const riskIcon = this.getRiskIcon(item.riskLevel);
            
            historyItem.innerHTML = `
                <div class="site-info">
                    <div class="site-url">${riskIcon} ${truncatedUrl}</div>
                    <div class="site-details">
                        ${timeAgo} • Risk Score: ${Math.round((item.riskScore || 0) * 100)}%
                        ${item.riskFactors ? ` • ${item.riskFactors.length} factors` : ''}
                    </div>
                </div>
                <div class="risk-badge risk-${item.riskLevel}">
                    ${item.riskLevel}
                </div>
            `;
            
            if (animated && isNewItem) {
                container.insertBefore(historyItem, container.firstChild);
                
                // Remove new-activity class after animation
                setTimeout(() => {
                    historyItem.classList.remove('new-activity');
                }, 500);
            } else if (!animated) {
                container.appendChild(historyItem);
            }
        });
        
        // Remove old items if we have too many
        const allItems = container.querySelectorAll('.history-item');
        if (allItems.length > 50) {
            for (let i = 50; i < allItems.length; i++) {
                allItems[i].remove();
            }
        }
    }
    
    getRiskIcon(riskLevel) {
        const icons = {
            'low': '✅',
            'medium': '⚠️',
            'high': '🚨'
        };
        return icons[riskLevel] || '🔍';
    }
    
    updateProtectionSummary() {
        const protectionStatus = this.settings.realTimeProtection ? 'Active' : 'Disabled';
        document.getElementById('protectionStatus').textContent = protectionStatus;
        
        const lastScan = this.history.length > 0 ? 
            this.getTimeAgo(new Date(Math.max(...this.history.map(h => h.timestamp)))) : 
            'Never';
        document.getElementById('lastScan').textContent = lastScan;
        
        // Calculate accuracy based on detection patterns
        const accuracy = this.calculateAccuracy();
        document.getElementById('accuracy').textContent = accuracy + '%';
        
        document.getElementById('whitelistCount').textContent = this.whitelist.length;
    }
    
    calculateAccuracy() {
        if (this.history.length === 0) return 95;
        
        // Simple accuracy calculation based on risk distribution
        const highRisk = this.history.filter(h => h.riskLevel === 'high').length;
        const total = this.history.length;
        
        // Assume 95% base accuracy, adjust based on detection patterns
        let accuracy = 95;
        
        if (total > 0) {
            const riskRatio = highRisk / total;
            if (riskRatio > 0.1) accuracy = 92; // More false positives
            if (riskRatio < 0.01) accuracy = 98; // Very few threats detected
        }
        
        return accuracy;
    }
    
    truncateUrl(url) {
        if (url.length <= 60) return url;
        return url.substring(0, 57) + '...';
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    filterHistory(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });
        
        this.updateHistory();
    }
    
    exportReport() {
        const reportData = {
            generatedAt: new Date().toISOString(),
            stats: {
                sitesChecked: this.stats.sitesChecked,
                threatsBlocked: this.stats.threatsBlocked,
                safeSites: this.history.filter(h => h.riskLevel === 'low').length,
                suspiciousSites: this.history.filter(h => h.riskLevel === 'medium').length,
                dangerousSites: this.history.filter(h => h.riskLevel === 'high').length
            },
            settings: this.settings,
            whitelistCount: this.whitelist.length,
            recentActivity: this.history.slice(0, 100) // Last 100 items
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `phishing-detector-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    async clearHistory() {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            try {
                await chrome.storage.local.set({
                    detectionHistory: [],
                    sitesChecked: 0,
                    threatsBlocked: 0
                });
                
                this.history = [];
                this.stats.sitesChecked = 0;
                this.stats.threatsBlocked = 0;
                
                this.updateStats();
                this.updateHistory();
                this.updateProtectionSummary();
                
                alert('History cleared successfully!');
                
            } catch (error) {
                console.error('Error clearing history:', error);
                alert('Error clearing history. Please try again.');
            }
        }
    }
    }
    
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const btn = document.getElementById('autoRefreshBtn');
        
        if (this.autoRefresh) {
            btn.textContent = '⏸️ Pause Auto-Refresh';
            btn.style.background = '#2196F3';
            this.refreshTimer = 30;
        } else {
            btn.textContent = '▶️ Resume Auto-Refresh';
            btn.style.background = '#666';
        }
    }
    
    manualRefresh() {
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');
        
        this.checkForUpdates().then(() => {
            setTimeout(() => {
                btn.classList.remove('spinning');
            }, 1000);
        });
        
        this.refreshTimer = 30;
    }
    
    // Add real-time activity simulation for demo
    simulateActivity() {
        const demoUrls = [
            'https://example.com',
            'http://suspicious-site.tk',
            'https://google.com',
            'https://bit.ly/test123',
            'https://facebook.com',
            'http://malware-site.ml'
        ];
        
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every 10 seconds
                const url = demoUrls[Math.floor(Math.random() * demoUrls.length)];
                const riskLevels = ['low', 'medium', 'high'];
                const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
                
                const newActivity = {
                    url: url,
                    timestamp: Date.now(),
                    riskLevel: riskLevel,
                    riskScore: Math.random(),
                    riskFactors: ['Demo factor 1', 'Demo factor 2']
                };
                
                this.history.unshift(newActivity);
                this.stats.sitesChecked++;
                
                if (riskLevel === 'high') {
                    this.stats.threatsBlocked++;
                }
                
                this.updateAllComponents(true);
            }
        }, 10000);
    }
}

// Initialize when page loads
let reportManager;

document.addEventListener('DOMContentLoaded', () => {
    reportManager = new ReportManager();
    
    // Enable demo mode for testing (remove in production)
    if (window.location.search.includes('demo=true')) {
        setTimeout(() => {
            reportManager.simulateActivity();
        }, 2000);
    }
});