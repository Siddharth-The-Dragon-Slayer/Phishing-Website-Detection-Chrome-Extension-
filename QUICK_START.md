# 🚀 Quick Start Guide - 5 Minutes to Working Extension!

## Step 1: Load Extension (2 minutes)

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in address bar
   - OR: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle switch in top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select this folder (Phishing-Website-Detection-Chrome-Extension-)
   - Extension loads immediately!

## Step 2: Verify It Works (1 minute)

1. **Check the Icon**
   - Look for 🛡️ icon in Chrome toolbar
   - If not visible, click puzzle icon and pin it

2. **Test on This Page**
   - Open `test.html` from this folder
   - Click on the test links
   - You should see warning banners!

3. **Check the Popup**
   - Click the 🛡️ extension icon
   - See risk analysis and statistics

## Step 3: Test Real Websites (2 minutes)

### Try These:
- ✅ **Safe**: https://google.com (should be green)
- ⚠️ **Medium Risk**: http://example.com (no HTTPS)
- 🚨 **High Risk**: Any .tk or .ml domain

### What to Look For:
- Warning banners on risky sites
- Badge icon changes color
- Popup shows risk details
- Statistics increment

## ✅ Success Checklist

- [ ] Extension icon visible in toolbar
- [ ] Warning banners appear on test links
- [ ] Popup opens and shows analysis
- [ ] Badge changes color based on risk
- [ ] No errors in console (F12)

## 🎉 You're Done!

The extension is now protecting you from phishing sites!

### What Happens Now:
- **Automatic scanning** of every site you visit
- **Warning banners** on suspicious sites
- **Badge updates** showing risk level
- **Statistics tracking** in popup

## 🐛 Quick Fixes

**Extension won't load?**
- Make sure Developer mode is ON
- Check for red error messages
- Try reloading the extension

**No warnings showing?**
- Refresh the page after loading extension
- Check if content scripts are enabled
- Look for errors in console (F12)

**Popup not working?**
- Can't analyze chrome:// pages (normal)
- Try on a regular website
- Reload the extension

## 📊 For Your Presentation

### Key Points to Demonstrate:
1. **Real-time Detection**: Visit different sites, show instant analysis
2. **Visual Warnings**: Show warning banners on risky sites
3. **Risk Scoring**: Explain the 0-100% risk calculation
4. **Statistics**: Show sites checked and threats blocked
5. **Rule-based ML**: Explain the detection algorithm

### Demo Flow:
1. Show extension in Chrome
2. Visit test.html and click links
3. Show warning banners
4. Open popup and explain risk factors
5. Visit safe site (Google) to show green status
6. Show statistics tracking

### Technical Highlights:
- Manifest V3 (latest Chrome standard)
- Content scripts for page analysis
- Service worker background script
- Local storage for statistics
- Rule-based machine learning
- No external API calls (privacy-focused)

## 🎓 Project Details

**Course**: MLDL (Machine Learning & Deep Learning)
**Type**: Mini Project
**Technology**: Chrome Extension + JavaScript + Python (optional)
**Detection Method**: Rule-based ML algorithms

## 📝 Files Overview

- `manifest.json` - Extension configuration
- `background_simple.js` - Background monitoring
- `content.js` - Page analysis script
- `simple_detector.js` - Detection algorithm
- `popup.html/js` - User interface
- `test.html` - Testing page

## 🔥 Pro Tips

1. **Keep console open** (F12) during demo to show no errors
2. **Prepare test URLs** beforehand
3. **Explain risk factors** when they appear
4. **Show statistics** to prove it's working
5. **Mention privacy** - all local, no data sent out

---

**Need help?** Check README.md for detailed documentation!

**Good luck with your presentation! 🎉**
