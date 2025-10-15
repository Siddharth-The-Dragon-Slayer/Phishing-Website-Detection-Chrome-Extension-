class PhishingDetectorBackground {
    constructor() {
        this.initializeBackground();
    }
    
    initializeBackground() {
        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.analyzeURL(tab.url, tabId);
            }
        });
        
        // Initialize storage
        this.initializeStorage();
    }
    
    async initializeStorage() {
        const defaultData = {
            sitesChecked: 0,
            threatsBlocked: 0,
            settings: {
                realTimeProtection: true,
                showWarnings: true,
                blockPhishing: false,
                sensitivity: 'medium'
            },
            whitelist: [],
            blacklist: [],
            detectionHistory: []
        };
        
        const stored = await chrome.storage.local.get(Object.keys(defaultData));
        
        // Set defaults for missing keys
        const toSet = {};
        for (const [key, value] of Object.entries(defaultData)) {
            if (!(key in stored)) {
                toSet[key] = value;
            }
        }
        
        if (Object.keys(toSet).length > 0) {
            await chrome.storage.local.set(toSet);
        }
    }
    
    async analyzeURL(url, tabId) {
        try {
            const features = this.extractURLFeatures(url);
            const riskScore = this.calculateRiskScore(features);
            const riskLevel = this.getRiskLevel(riskScore);
            
            // Update badge
            this.updateBadge(tabId, riskLevel, riskScore);
            
            // Store analysis
            const analysis = {
                url: url,
                timestamp: Date.now(),
                riskScore: riskScore,
                riskLevel: riskLevel,
                features: features
            };
            
            await this.storeAnalysis(analysis);
            
            // Check if should block
            const settings = await this.getSettings();
            if (settings.blockPhishing && riskLevel === 'high') {
                this.blockPhishingSite(tabId, url);
            }
            
        } catch (error) {
            console.error('Error analyzing URL:', error);
        }
    }
    
    extractURLFeatures(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            
            return {
                url_length: url.length,
                domain_length: domain.length,
                has_https: url.startsWith('https://'),
                has_ip_address: /\d+\.\d+\.\d+\.\d+/.test(domain),
                has_suspicious_tld: this.hasSuspiciousTLD(domain),
                url_depth: (url.match(/\//g) || []).length - 2,
                has_shortening_service: this.isShortURL(domain),
                suspicious_keywords: this.countSuspiciousKeywords(url),
                has_subdomain: (domain.match(/\./g) || []).length > 1,
                path_length: urlObj.pathname.length,
                query_length: urlObj.search.length,
                fragment_length: urlObj.hash.length
            };
        } catch (error) {
            console.error('Error extracting URL features:', error);
            return {};
        }
    }
    
    calculateRiskScore(features) {
        let score = 0;
        
        // URL-based scoring
        if (!features.has_https) score += 0.2;
        if (features.has_ip_address) score += 0.3;
        if (features.has_suspicious_tld) score += 0.25;
        if (features.has_shortening_service) score += 0.15;
        if (features.url_length > 100) score += 0.1;
        if (features.suspicious_keywords > 2) score += 0.2;
        if (features.url_depth > 5) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    getRiskLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }
    
    updateBadge(tabId, riskLevel, riskScore) {
        const badgeConfig = {
            'low': { text: '✓', color: '#4CAF50' },
            'medium': { text: '!', color: '#FF9800' },
            'high': { text: '⚠', color: '#f44336' }
        };
        
        const config = badgeConfig[riskLevel] || badgeConfig['low'];
        
        chrome.action.setBadgeText({
            text: config.text,
            tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: config.color,
            tabId: tabId
        });
        
        // Update title with risk score
        chrome.action.setTitle({
            title: `Phishing Risk: ${Math.round(riskScore * 100)}%`,
            tabId: tabId
        });
    }
    
    async blockPhishingSite(tabId, url) {
        // Redirect to warning page
        const warningURL = chrome.runtime.getURL('warning.html') + '?blocked=' + encodeURIComponent(url);
        chrome.tabs.update(tabId, { url: warningURL });
        
        // Update stats
        const stats = await chrome.storage.local.get(['threatsBlocked']);
        await chrome.storage.local.set({
            threatsBlocked: (stats.threatsBlocked || 0) + 1
        });
    }
    
    async storeAnalysis(analysis) {
        try {
            const { detectionHistory = [] } = await chrome.storage.local.get(['detectionHistory']);
            
            // Keep only last 100 entries
            detectionHistory.push(analysis);
            if (detectionHistory.length > 100) {
                detectionHistory.shift();
            }
            
            await chrome.storage.local.set({ detectionHistory });
            
            // Update sites checked counter
            const { sitesChecked = 0 } = await chrome.storage.local.get(['sitesChecked']);
            await chrome.storage.local.set({ sitesChecked: sitesChecked + 1 });
            
        } catch (error) {
            console.error('Error storing analysis:', error);
        }
    }
    
    async getSettings() {
        const { settings } = await chrome.storage.local.get(['settings']);
        return settings || {};
    }
    

    
    hasSuspiciousTLD(domain) {
        const suspiciousTLDs = [
            '.tk', '.ml', '.ga', '.cf', '.click', '.download', 
            '.zip', '.review', '.country', '.kim', '.cricket'
        ];
        return suspiciousTLDs.some(tld => domain.endsWith(tld));
    }
    
    isShortURL(domain) {
        const shorteners = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
            'short.link', 'tiny.cc', 'is.gd', 'buff.ly'
        ];
        return shorteners.includes(domain);
    }
    
    countSuspiciousKeywords(url) {
        const keywords = [
            'secure', 'account', 'update', 'verify', 'login', 
            'bank', 'paypal', 'amazon', 'microsoft', 'apple',
            'urgent', 'suspended', 'expired', 'winner', 'prize'
        ];
        const lowerURL = url.toLowerCase();
        return keywords.filter(keyword => lowerURL.includes(keyword)).length;
    }
}

// Initialize background service
new PhishingDetectorBackground();