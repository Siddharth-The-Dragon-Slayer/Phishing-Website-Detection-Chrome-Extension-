class PhishingDetector {
    constructor() {
        this.detector = new SimplePhishingDetector();
        this.initializeDetector();
    }
    
    async initializeDetector() {
        console.log('🛡️ Phishing detector initialized');
        
        // Start real-time monitoring
        this.startMonitoring();
        
        // Analyze current page immediately
        this.analyzeCurrentPage();
    }
    
    startMonitoring() {
        // Monitor for navigation changes
        let currentURL = window.location.href;
        
        // Check for URL changes (for SPAs) - store interval ID for cleanup
        this.monitoringInterval = setInterval(() => {
            if (window.location.href !== currentURL) {
                currentURL = window.location.href;
                this.analyzeCurrentPage();
            }
        }, 2000); // Changed to 2 seconds to reduce overhead
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
            }
        });
    }
    
    analyzeCurrentPage() {
        const currentURL = window.location.href;
        const analysis = this.detector.analyzeURL(currentURL);
        
        // Store analysis for popup
        chrome.storage.local.set({ 
            currentAnalysis: {
                prediction: analysis.riskLevel === 'HIGH' ? 'phishing' : 'legitimate',
                riskScore: analysis.riskScore,
                riskLevel: analysis.riskLevel.toLowerCase(),
                features: this.extractSimpleFeatures(currentURL),
                riskFactors: analysis.riskFactors,
                riskMessage: analysis.riskMessage
            },
            lastChecked: Date.now()
        });
        
        // Show warning if needed
        if (analysis.shouldWarn) {
            this.showWarning(analysis);
        }
        
        console.log('🔍 Site Analysis:', analysis);
    }
    
    extractSimpleFeatures(url) {
        const domain = window.location.hostname;
        
        return {
            url_length: url.length,
            domain_length: domain.length,
            has_https: url.startsWith('https://'),
            has_ip_address: /\d+\.\d+\.\d+\.\d+/.test(domain),
            has_suspicious_tld: this.hasSuspiciousTLD(domain),
            has_shortening_service: this.isShortURL(domain),
            suspicious_keywords: this.countSuspiciousKeywords(url),
            has_forms: document.querySelectorAll('form').length > 0,
            has_password_fields: document.querySelectorAll('input[type="password"]').length > 0
        };
    }
    
    hasSuspiciousTLD(domain) {
        const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.click', '.download'];
        return suspiciousTLDs.some(tld => domain.endsWith(tld));
    }
    
    isShortURL(domain) {
        const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'];
        return shorteners.includes(domain);
    }
    
    countSuspiciousKeywords(url) {
        const keywords = ['secure', 'account', 'update', 'verify', 'login', 'bank', 'paypal'];
        return keywords.filter(keyword => url.toLowerCase().includes(keyword)).length;
    }
    
    showWarning(analysis) {
        // Remove existing warning
        const existingWarning = document.getElementById('phishing-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // Create warning banner
        const warning = document.createElement('div');
        warning.id = 'phishing-warning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: ${analysis.riskLevel === 'HIGH' ? 
                'linear-gradient(135deg, #f44336, #d32f2f)' : 
                'linear-gradient(135deg, #FF9800, #f57c00)'};
            color: white;
            padding: 15px 20px;
            text-align: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            border-bottom: 3px solid rgba(255,255,255,0.3);
        `;
        
        warning.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <div style="font-size: 24px;">${analysis.riskLevel === 'HIGH' ? '🚨' : '⚠️'}</div>
                <div>
                    <div style="font-size: 18px; margin-bottom: 5px;">${analysis.riskMessage}</div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        Risk Score: ${Math.round(analysis.riskScore * 100)}% | 
                        Factors: ${analysis.riskFactors.slice(0, 2).join(', ')}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.5);
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    ✕ Dismiss
                </button>
            </div>
        `;
        
        // Insert at top of page
        document.body.insertBefore(warning, document.body.firstChild);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.style.transition = 'all 0.5s ease';
                warning.style.transform = 'translateY(-100%)';
                setTimeout(() => warning.remove(), 500);
            }
        }, 15000);
        
        // Update stats
        this.updateThreatStats();
    }
    
    async updateThreatStats() {
        try {
            const stats = await chrome.storage.local.get(['threatsBlocked']);
            await chrome.storage.local.set({
                threatsBlocked: (stats.threatsBlocked || 0) + 1
            });
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeCurrentSite') {
        chrome.storage.local.get(['currentAnalysis']).then(result => {
            sendResponse({ analysis: result.currentAnalysis });
        });
        return true; // Keep message channel open for async response
    }
});

// Initialize detector when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PhishingDetector();
    });
} else {
    new PhishingDetector();
}