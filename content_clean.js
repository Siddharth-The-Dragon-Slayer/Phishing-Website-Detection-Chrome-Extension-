// Simple Phishing Detector Content Script
class PhishingDetector {
    constructor() {
        this.detector = new SimplePhishingDetector();
        this.init();
    }
    
    init() {
        console.log('🛡️ Phishing detector started');
        this.analyzeCurrentPage();
        this.startMonitoring();
    }
    
    startMonitoring() {
        let currentURL = window.location.href;
        
        setInterval(() => {
            if (window.location.href !== currentURL) {
                currentURL = window.location.href;
                this.analyzeCurrentPage();
            }
        }, 2000);
    }
    
    analyzeCurrentPage() {
        try {
            const currentURL = window.location.href;
            const analysis = this.detector.analyzeURL(currentURL);
            
            // Store for popup
            chrome.storage.local.set({ 
                currentAnalysis: {
                    prediction: analysis.riskLevel === 'HIGH' ? 'phishing' : 'legitimate',
                    riskScore: analysis.riskScore,
                    riskLevel: analysis.riskLevel.toLowerCase(),
                    riskFactors: analysis.riskFactors,
                    riskMessage: analysis.riskMessage,
                    features: {
                        url_length: currentURL.length,
                        has_https: currentURL.startsWith('https://'),
                        domain: window.location.hostname
                    }
                },
                lastChecked: Date.now()
            });
            
            // Show warning if risky
            if (analysis.shouldWarn) {
                this.showWarning(analysis);
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
        }
    }
    
    showWarning(analysis) {
        // Remove existing warning
        const existing = document.getElementById('phishing-warning');
        if (existing) existing.remove();
        
        // Create warning
        const warning = document.createElement('div');
        warning.id = 'phishing-warning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: ${analysis.riskLevel === 'HIGH' ? '#f44336' : '#FF9800'};
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        warning.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <span style="font-size: 24px;">${analysis.riskLevel === 'HIGH' ? '🚨' : '⚠️'}</span>
                <span>${analysis.riskMessage}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid white;
                    padding: 5px 15px;
                    border-radius: 3px;
                    cursor: pointer;
                ">✕ Dismiss</button>
            </div>
        `;
        
        document.body.insertBefore(warning, document.body.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) warning.remove();
        }, 10000);
        
        // Update stats
        this.updateStats();
    }
    
    async updateStats() {
        try {
            const stats = await chrome.storage.local.get(['threatsBlocked']);
            await chrome.storage.local.set({
                threatsBlocked: (stats.threatsBlocked || 0) + 1
            });
        } catch (error) {
            console.error('Stats error:', error);
        }
    }
}

// Message listener for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeCurrentSite') {
        chrome.storage.local.get(['currentAnalysis']).then(result => {
            sendResponse({ analysis: result.currentAnalysis });
        });
        return true;
    }
});

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PhishingDetector());
} else {
    new PhishingDetector();
}