// Settings Page JavaScript

class SettingsManager {
    constructor() {
        this.settings = {
            realTimeProtection: true,
            showWarnings: true,
            blockPhishing: false,
            sensitivity: 'medium'
        };
        this.whitelist = [];
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.loadStats();
    }
    
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get(['settings', 'whitelist']);
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }
            if (data.whitelist) {
                this.whitelist = data.whitelist;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    setupEventListeners() {
        // Toggle switches
        document.getElementById('realTimeToggle').addEventListener('click', () => {
            this.toggleSetting('realTimeProtection', 'realTimeToggle');
        });
        
        document.getElementById('warningsToggle').addEventListener('click', () => {
            this.toggleSetting('showWarnings', 'warningsToggle');
        });
        
        document.getElementById('blockToggle').addEventListener('click', () => {
            this.toggleSetting('blockPhishing', 'blockToggle');
        });
        
        // Sensitivity select
        document.getElementById('sensitivitySelect').addEventListener('change', (e) => {
            this.settings.sensitivity = e.target.value;
        });
        
        // Whitelist input
        document.getElementById('whitelistInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addToWhitelist();
            }
        });
        
        // Button event listeners
        document.getElementById('addWhitelistBtn').addEventListener('click', () => {
            this.addToWhitelist();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSettings();
        });
        
        document.getElementById('closeBtn').addEventListener('click', () => {
            window.close();
        });
    }
    
    toggleSetting(settingName, toggleId) {
        this.settings[settingName] = !this.settings[settingName];
        const toggle = document.getElementById(toggleId);
        toggle.classList.toggle('active', this.settings[settingName]);
    }
    
    updateUI() {
        // Update toggles
        document.getElementById('realTimeToggle').classList.toggle('active', this.settings.realTimeProtection);
        document.getElementById('warningsToggle').classList.toggle('active', this.settings.showWarnings);
        document.getElementById('blockToggle').classList.toggle('active', this.settings.blockPhishing);
        
        // Update sensitivity
        document.getElementById('sensitivitySelect').value = this.settings.sensitivity;
        
        // Update whitelist
        this.updateWhitelistUI();
    }
    
    updateWhitelistUI() {
        const container = document.getElementById('whitelistContainer');
        container.innerHTML = '';
        
        if (this.whitelist.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">No trusted sites added yet</p>';
            return;
        }
        
        this.whitelist.forEach((domain, index) => {
            const item = document.createElement('div');
            item.className = 'whitelist-item';
            item.innerHTML = `
                <span>🌐 ${domain}</span>
                <button class="remove-btn" data-index="${index}">Remove</button>
            `;
            
            // Add event listener to remove button
            const removeBtn = item.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeFromWhitelist(index);
            });
            
            container.appendChild(item);
        });
    }
    
    addToWhitelist() {
        const input = document.getElementById('whitelistInput');
        const domain = input.value.trim().toLowerCase();
        
        if (!domain) return;
        
        // Basic domain validation
        if (!domain.includes('.') || domain.includes(' ')) {
            alert('Please enter a valid domain (e.g., example.com)');
            return;
        }
        
        // Remove protocol if present
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        if (!this.whitelist.includes(cleanDomain)) {
            this.whitelist.push(cleanDomain);
            this.updateWhitelistUI();
            input.value = '';
        } else {
            alert('Domain already in whitelist');
        }
    }
    
    removeFromWhitelist(index) {
        this.whitelist.splice(index, 1);
        this.updateWhitelistUI();
    }
    
    async loadStats() {
        try {
            const stats = await chrome.storage.local.get(['sitesChecked', 'threatsBlocked']);
            document.getElementById('sitesChecked').textContent = stats.sitesChecked || 0;
            document.getElementById('threatsBlocked').textContent = stats.threatsBlocked || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    async saveSettings() {
        try {
            await chrome.storage.local.set({
                settings: this.settings,
                whitelist: this.whitelist
            });
            
            // Show success message
            const btn = document.querySelector('button[onclick="saveSettings()"]');
            const originalText = btn.textContent;
            btn.textContent = '✅ Saved!';
            btn.style.background = '#4CAF50';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#2196F3';
            }, 2000);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }
    
    exportData() {
        const data = {
            settings: this.settings,
            whitelist: this.whitelist,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phishing-detector-settings.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    async clearHistory() {
        if (confirm('Are you sure you want to clear all detection history?')) {
            try {
                await chrome.storage.local.set({
                    detectionHistory: [],
                    sitesChecked: 0,
                    threatsBlocked: 0
                });
                
                this.loadStats();
                alert('History cleared successfully!');
            } catch (error) {
                console.error('Error clearing history:', error);
                alert('Error clearing history. Please try again.');
            }
        }
    }
    
    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.settings = {
                realTimeProtection: true,
                showWarnings: true,
                blockPhishing: false,
                sensitivity: 'medium'
            };
            this.whitelist = [];
            
            await this.saveSettings();
            this.updateUI();
            
            alert('Settings reset to defaults!');
        }
    }
}

// Initialize when page loads
let settingsManager;

document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});