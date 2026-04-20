class PhishingDetectorPopup {
    constructor() {
        this.initializeElements();
        this.loadCurrentSiteAnalysis();
        this.loadStats();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.statusContainer = document.getElementById('status-container');
        this.detailsContainer = document.getElementById('details-container');
        this.featuresList = document.getElementById('features-list');
        this.scanBtn = document.getElementById('scan-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.reportBtn = document.getElementById('report-btn');
        this.sitesChecked = document.getElementById('sites-checked');
        this.threatsBlocked = document.getElementById('threats-blocked');
    }
    
    setupEventListeners() {
        this.scanBtn.addEventListener('click', () => this.scanCurrentSite());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.reportBtn.addEventListener('click', () => this.openReport());
    }
    
    async loadCurrentSiteAnalysis() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if it's a chrome:// or other restricted URL
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
                this.showError('Cannot analyze browser internal pages');
                return;
            }
            
            // Try to get analysis from storage first (faster)
            const stored = await chrome.storage.local.get(['currentAnalysis']);
            if (stored.currentAnalysis) {
                this.displayAnalysis(stored.currentAnalysis);
                return;
            }
            
            // Send message to content script for analysis with timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            
            const messagePromise = chrome.tabs.sendMessage(tab.id, { 
                action: 'analyzeCurrentSite' 
            });
            
            const response = await Promise.race([messagePromise, timeoutPromise]);
            
            if (response && response.analysis) {
                this.displayAnalysis(response.analysis);
            } else {
                // Fallback: analyze URL directly
                await this.analyzeURLDirectly(tab.url);
            }
        } catch (error) {
            console.error('Error loading analysis:', error);
            // Try to get from storage as fallback
            const stored = await chrome.storage.local.get(['currentAnalysis']);
            if (stored.currentAnalysis) {
                this.displayAnalysis(stored.currentAnalysis);
            } else {
                // Last resort: analyze URL directly
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url) {
                    await this.analyzeURLDirectly(tab.url);
                } else {
                    this.showError('Unable to analyze current site');
                }
            }
        }
    }
    
    async analyzeURLDirectly(url) {
        // Simple direct analysis when content script is not available
        const detector = new SimplePhishingDetector();
        const analysis = detector.analyzeURL(url);
        
        const formattedAnalysis = {
            prediction: analysis.riskLevel === 'HIGH' ? 'phishing' : 'legitimate',
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel.toLowerCase(),
            features: {
                url_length: url.length,
                has_https: url.startsWith('https://'),
                domain: analysis.domain
            },
            riskFactors: analysis.riskFactors,
            riskMessage: analysis.riskMessage
        };
        
        this.displayAnalysis(formattedAnalysis);
    }
    
    displayAnalysis(analysis) {
        const { riskScore, riskLevel, features, prediction, riskFactors, riskMessage } = analysis;
        
        // Update status card
        this.statusContainer.innerHTML = this.createStatusCard(riskScore, riskLevel, prediction, riskMessage);
        
        // Show details
        this.detailsContainer.style.display = 'block';
        
        // Update features list - show risk factors if available
        if (riskFactors && riskFactors.length > 0) {
            this.featuresList.innerHTML = this.createRiskFactorsList(riskFactors);
        } else {
            this.featuresList.innerHTML = this.createFeaturesList(features);
        }
    }
    
    createStatusCard(score, level, prediction, riskMessage) {
        const statusClass = this.getRiskClass(level);
        const icon = this.getRiskIcon(level);
        const message = riskMessage || this.getRiskMessage(level, prediction);
        
        return `
            <div class="status-card ${statusClass}">
                <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
                <div class="score">${Math.round(score * 100)}%</div>
                <div style="font-size: 16px; font-weight: bold; line-height: 1.3;">${message}</div>
                <div style="margin-top: 10px; opacity: 0.9; font-size: 14px;">
                    Risk Level: ${level.toUpperCase()}
                </div>
            </div>
        `;
    }
    
    createRiskFactorsList(riskFactors) {
        if (!riskFactors || riskFactors.length === 0) {
            return '<div style="text-align: center; color: #666;">No specific risk factors detected</div>';
        }
        
        return riskFactors.map(factor => `
            <div class="feature">
                <span style="color: #f44336;">⚠️</span>
                <span>${factor}</span>
            </div>
        `).join('');
    }
    
    createFeaturesList(features) {
        return Object.entries(features).map(([key, value]) => `
            <div class="feature">
                <span>${this.formatFeatureName(key)}</span>
                <span style="font-weight: bold; color: ${this.getFeatureColor(value)}">
                    ${this.formatFeatureValue(value)}
                </span>
            </div>
        `).join('');
    }
    
    getRiskClass(level) {
        const classes = {
            'low': 'safe',
            'medium': 'warning',
            'high': 'danger'
        };
        return classes[level] || 'analyzing';
    }
    
    getRiskIcon(level) {
        const icons = {
            'low': '✅',
            'medium': '⚠️',
            'high': '🚨'
        };
        return icons[level] || '🔍';
    }
    
    getRiskMessage(level, prediction) {
        if (prediction === 'phishing') {
            return 'PHISHING DETECTED';
        } else if (level === 'high') {
            return 'HIGH RISK SITE';
        } else if (level === 'medium') {
            return 'SUSPICIOUS ACTIVITY';
        } else {
            return 'SITE APPEARS SAFE';
        }
    }
    
    getFeatureColor(value) {
        if (typeof value === 'boolean') {
            return value ? '#f44336' : '#4CAF50';
        } else if (typeof value === 'number') {
            return value > 0.5 ? '#f44336' : '#4CAF50';
        }
        return '#666';
    }
    
    formatFeatureName(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    formatFeatureValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return String(value);
    }
    
    async scanCurrentSite() {
        this.scanBtn.disabled = true;
        this.scanBtn.textContent = '🔍 Scanning...';
        
        try {
            await this.loadCurrentSiteAnalysis();
            await this.updateStats();
        } finally {
            this.scanBtn.disabled = false;
            this.scanBtn.textContent = '🔍 Scan Current Site';
        }
    }
    
    async loadStats() {
        try {
            const stats = await chrome.storage.local.get(['sitesChecked', 'threatsBlocked']);
            this.sitesChecked.textContent = stats.sitesChecked || 0;
            this.threatsBlocked.textContent = stats.threatsBlocked || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    async updateStats() {
        try {
            const stats = await chrome.storage.local.get(['sitesChecked', 'threatsBlocked']);
            const newSitesChecked = (stats.sitesChecked || 0) + 1;
            
            await chrome.storage.local.set({ sitesChecked: newSitesChecked });
            this.sitesChecked.textContent = newSitesChecked;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    openSettings() {
        chrome.tabs.create({ url: 'settings.html' });
    }
    
    openReport() {
        chrome.tabs.create({ url: 'report.html' });
    }
    
    showError(message) {
        this.statusContainer.innerHTML = `
            <div class="status-card danger">
                <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                <div style="font-size: 18px; font-weight: bold;">${message}</div>
            </div>
        `;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PhishingDetectorPopup();
});