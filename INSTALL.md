# 🛡️ Phishing Detector Extension - Installation Guide

## ⚡ Quick Install (2 Minutes!)

### Step 1: Load Extension in Chrome
1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top right corner)
3. **Click "Load unpacked"**
4. **Select the `phishing-detector-extension` folder**
5. **Done!** Extension is now active 🎉

### Step 2: Test It Works
1. **Open `test.html`** in the extension folder
2. **Click on the test links** to see warnings
3. **Visit any HTTP site** (no HTTPS) to see a warning banner
4. **Click the extension icon** in toolbar for detailed analysis

## 🎯 What It Detects

### 🚨 HIGH RISK (Red Warning)
- Sites using IP addresses instead of domains
- Suspicious domain extensions (.tk, .ml, .ga, .cf, etc.)
- Multiple phishing keywords (secure, verify, account, etc.)
- No HTTPS encryption

### ⚠️ MEDIUM RISK (Orange Warning)
- URL shortening services (bit.ly, tinyurl, etc.)
- Suspicious keywords in URL
- Very long URLs (over 100 characters)
- Multiple subdomains

### ✅ LOW RISK (Green - Safe)
- HTTPS enabled
- Trusted domains (google.com, amazon.com, etc.)
- Normal URL structure
- No suspicious patterns

## 🔧 How It Works
- **Instant Analysis**: No training required, works immediately
- **Real-time Warnings**: Shows banner on risky sites
- **Smart Detection**: Uses rule-based algorithms
- **Privacy Focused**: All analysis happens locally

## 🚀 Features
- **Automatic scanning** of every site you visit
- **Visual warning banners** for dangerous sites
- **Detailed risk analysis** in popup window
- **Statistics tracking** (sites checked, threats blocked)
- **Zero configuration** needed

## 🔍 Usage
1. **Browse normally** - extension works automatically
2. **Look for warning banners** on risky sites
3. **Click extension icon** for detailed analysis
4. **View statistics** in the popup

## ❌ Troubleshooting
- **Extension won't load**: Make sure no `__pycache__` folders exist
- **No warnings showing**: Check if extension is enabled
- **Popup not working**: Refresh the page and try again

**The extension is ready to protect you immediately!** 🛡️