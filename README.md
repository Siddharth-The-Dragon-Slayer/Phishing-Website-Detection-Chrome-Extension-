# 🛡️ DMBI Phishing Website Detection Chrome Extension

A real-time phishing detection Chrome extension that uses rule-based machine learning algorithms to protect users from malicious websites.

## ✨ Features

- **Real-time Protection**: Automatically scans every website you visit
- **Visual Warnings**: Shows prominent warning banners on suspicious sites
- **Risk Analysis**: Detailed risk assessment with specific threat factors
- **Statistics Tracking**: Monitors sites checked and threats blocked
- **Zero Configuration**: Works immediately after installation
- **Privacy-Focused**: All analysis happens locally in your browser

## 🚀 Quick Installation

### Step 1: Download the Extension
1. Clone or download this repository
2. Extract the files to a folder on your computer

### Step 2: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the extension folder
5. Done! The extension is now active 🎉

### Step 3: Verify Installation
- Look for the 🛡️ icon in your Chrome toolbar
- Visit any website and click the icon to see the analysis
- Try visiting `http://` sites (without HTTPS) to see warnings

## 🎯 How It Works

The extension uses a sophisticated rule-based detection system that analyzes:

### High-Risk Indicators (🚨)
- IP addresses instead of domain names
- Suspicious TLDs (.tk, .ml, .ga, .cf, .click, etc.)
- Multiple phishing keywords (secure, verify, account, login, etc.)
- Missing HTTPS encryption
- Excessive special characters

### Medium-Risk Indicators (⚠️)
- URL shortening services (bit.ly, tinyurl, etc.)
- Suspicious keywords in URL
- Very long URLs (>100 characters)
- Multiple subdomains (>3)

### Safe Indicators (✅)
- HTTPS enabled
- Trusted domains (google.com, amazon.com, etc.)
- Normal URL structure
- No suspicious patterns

## 📊 Risk Scoring

The extension calculates a risk score (0-100%) based on:
- **0-29%**: Low Risk (Green) - Site appears safe
- **30-59%**: Medium Risk (Orange) - Be cautious
- **60-100%**: High Risk (Red) - Potential phishing site

## 🔍 Usage

### Automatic Protection
- The extension works automatically in the background
- Warning banners appear on risky sites
- Badge icon shows current page risk level

### Manual Scan
1. Click the 🛡️ extension icon
2. View detailed risk analysis
3. See specific risk factors
4. Check statistics

### Understanding the Popup
- **Risk Score**: Overall danger level (0-100%)
- **Risk Level**: LOW, MEDIUM, or HIGH
- **Risk Factors**: Specific issues detected
- **Statistics**: Total sites checked and threats blocked

## 🛠️ For Developers

### Project Structure
```
├── manifest.json              # Extension configuration
├── background_simple.js       # Background service worker
├── content.js                 # Content script (main detector)
├── simple_detector.js         # Detection algorithm
├── popup.html/js              # Extension popup UI
├── settings.html/js           # Settings page
├── report.html/js             # Statistics report
├── train_models.py            # ML model training (optional)
├── data_processor.py          # Data preprocessing (optional)
└── icons/                     # Extension icons
```

### Key Components

#### SimplePhishingDetector (simple_detector.js)
- Core detection algorithm
- Rule-based analysis
- No training required
- Instant results

#### PhishingDetector (content.js)
- Runs on every webpage
- Monitors URL changes
- Shows warning banners
- Stores analysis results

#### Popup (popup.js/html)
- Displays risk analysis
- Shows statistics
- Provides manual scan option

### Machine Learning (Optional)

The extension includes Python scripts for training ML models:

```bash
# Install dependencies
pip install -r requirements.txt

# Train models (requires dataset)
python train_models.py
```

**Note**: The extension works perfectly without ML models using rule-based detection.

## 🔧 Configuration

### Manifest V3
The extension uses Chrome's latest Manifest V3 format with:
- Service worker background script
- Content scripts for page analysis
- Storage API for statistics
- Tabs API for monitoring

### Permissions
- `activeTab`: Access current tab information
- `storage`: Store statistics and settings
- `tabs`: Monitor tab updates
- `host_permissions`: Analyze all websites

## 🐛 Troubleshooting

### Extension Won't Load
- Ensure Developer mode is enabled
- Check for syntax errors in console
- Remove any `__pycache__` folders

### No Warnings Showing
- Verify extension is enabled
- Check if content scripts are blocked
- Refresh the page and try again

### Popup Not Working
- Make sure you're not on a `chrome://` page
- Check browser console for errors
- Try reloading the extension

### Analysis Shows "Unable to analyze"
- This is normal for browser internal pages
- Extension cannot access `chrome://` URLs
- Try on a regular website

## 📈 Statistics

The extension tracks:
- **Sites Checked**: Total number of websites analyzed
- **Threats Blocked**: Number of high-risk sites detected
- **Detection History**: Recent analysis results (stored locally)

## 🔒 Privacy & Security

- **No Data Collection**: All analysis happens locally
- **No External Requests**: No data sent to external servers
- **No Tracking**: Your browsing history stays private
- **Open Source**: Code is fully transparent and auditable

## 🎓 Educational Purpose

This extension was created as a DMBI (Data Mining and Business Intelligence) mini project to demonstrate:
- Machine learning concepts
- Chrome extension development
- Real-time threat detection
- User interface design

## 📝 Testing

Use the included `test.html` file to test the extension:
1. Open `test.html` in Chrome
2. Click on the test links
3. Observe warning banners and risk scores
4. Check the popup for detailed analysis

## 🤝 Contributing

This is an educational project. Feel free to:
- Report bugs
- Suggest improvements
- Add new detection rules
- Enhance the UI

## 📄 License

This project is for educational purposes. Use at your own risk.

## 🙏 Acknowledgments

Built using:
- Chrome Extension APIs
- Vanilla JavaScript
- Python scikit-learn (optional ML)
- Rule-based detection algorithms

---

**Made with ❤️ for MLDL Mini Project**

For questions or issues, please check the troubleshooting section or review the code comments.
