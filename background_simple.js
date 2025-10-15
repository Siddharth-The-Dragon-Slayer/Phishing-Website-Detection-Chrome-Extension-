// Simple Background Script for Phishing Detector

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        sitesChecked: 0,
        threatsBlocked: 0,
        settings: {
            realTimeProtection: true,
            showWarnings: true
        }
    });
    console.log('🛡️ Phishing Detector installed');
});

// Listen for tab updates to update badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateBadgeForTab(tabId, tab.url);
    }
});

function updateBadgeForTab(tabId, url) {
    try {
        // Simple risk assessment
        let riskLevel = 'low';
        
        if (!url.startsWith('https://')) {
            riskLevel = 'medium';
        }
        
        if (url.includes('.tk') || url.includes('.ml') || url.includes('bit.ly')) {
            riskLevel = 'high';
        }
        
        // Set badge
        const badgeConfig = {
            'low': { text: '✓', color: '#4CAF50' },
            'medium': { text: '!', color: '#FF9800' },
            'high': { text: '⚠', color: '#f44336' }
        };
        
        const config = badgeConfig[riskLevel];
        
        chrome.action.setBadgeText({
            text: config.text,
            tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: config.color,
            tabId: tabId
        });
        
    } catch (error) {
        console.error('Badge update error:', error);
    }
}