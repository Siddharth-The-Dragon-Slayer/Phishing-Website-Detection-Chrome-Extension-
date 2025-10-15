/**
 * Simple Fast Phishing Detector
 * No training required - uses rule-based detection
 */

class SimplePhishingDetector {
    constructor() {
        this.suspiciousDomains = new Set([
            // Common phishing domains (you can add more)
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
            'short.link', 'tiny.cc', 'is.gd', 'buff.ly'
        ]);
        
        this.suspiciousTLDs = new Set([
            '.tk', '.ml', '.ga', '.cf', '.click', '.download',
            '.zip', '.review', '.country', '.kim', '.cricket'
        ]);
        
        this.phishingKeywords = [
            'secure', 'account', 'update', 'verify', 'login',
            'bank', 'paypal', 'amazon', 'microsoft', 'apple',
            'urgent', 'suspended', 'expired', 'winner', 'prize',
            'confirm', 'validate', 'security', 'alert'
        ];
    }
    
    analyzeURL(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url);
            const domain = urlObj.hostname.toLowerCase();
            const fullURL = url.toLowerCase();
            
            let riskScore = 0;
            let riskFactors = [];
            
            // Check HTTPS
            if (!url.startsWith('https://')) {
                riskScore += 0.2;
                riskFactors.push('No HTTPS encryption');
            }
            
            // Check for IP address instead of domain
            if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
                riskScore += 0.4;
                riskFactors.push('Uses IP address instead of domain');
            }
            
            // Check suspicious TLDs
            for (let tld of this.suspiciousTLDs) {
                if (domain.endsWith(tld)) {
                    riskScore += 0.3;
                    riskFactors.push(`Suspicious domain extension: ${tld}`);
                    break;
                }
            }
            
            // Check URL shorteners
            for (let shortener of this.suspiciousDomains) {
                if (domain.includes(shortener)) {
                    riskScore += 0.25;
                    riskFactors.push('URL shortening service detected');
                    break;
                }
            }
            
            // Check suspicious keywords
            let keywordCount = 0;
            for (let keyword of this.phishingKeywords) {
                if (fullURL.includes(keyword)) {
                    keywordCount++;
                }
            }
            if (keywordCount > 0) {
                riskScore += Math.min(keywordCount * 0.1, 0.3);
                riskFactors.push(`${keywordCount} suspicious keyword(s) found`);
            }
            
            // Check URL length
            if (url.length > 100) {
                riskScore += 0.1;
                riskFactors.push('Unusually long URL');
            }
            
            // Check for excessive subdomains
            const subdomainCount = (domain.match(/\./g) || []).length;
            if (subdomainCount > 3) {
                riskScore += 0.15;
                riskFactors.push('Multiple subdomains detected');
            }
            
            // Check for suspicious characters
            if (/[@%&=?]{3,}/.test(url)) {
                riskScore += 0.1;
                riskFactors.push('Suspicious special characters');
            }
            
            // Determine risk level
            let riskLevel, riskMessage, shouldWarn;
            
            if (riskScore >= 0.6) {
                riskLevel = 'HIGH';
                riskMessage = '🚨 HIGH RISK - This site may be dangerous!';
                shouldWarn = true;
            } else if (riskScore >= 0.3) {
                riskLevel = 'MEDIUM';
                riskMessage = '⚠️ MEDIUM RISK - Be cautious on this site';
                shouldWarn = true;
            } else {
                riskLevel = 'LOW';
                riskMessage = '✅ This site appears safe';
                shouldWarn = false;
            }
            
            return {
                url: url,
                domain: domain,
                riskScore: Math.min(riskScore, 1.0),
                riskLevel: riskLevel,
                riskMessage: riskMessage,
                riskFactors: riskFactors,
                shouldWarn: shouldWarn,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error analyzing URL:', error);
            return {
                url: url,
                riskScore: 0.5,
                riskLevel: 'UNKNOWN',
                riskMessage: '❓ Unable to analyze this URL',
                riskFactors: ['Analysis failed'],
                shouldWarn: false,
                error: error.message
            };
        }
    }
    
    // Quick check for common safe domains
    isTrustedDomain(domain) {
        const trustedDomains = [
            'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
            'microsoft.com', 'apple.com', 'netflix.com', 'twitter.com',
            'instagram.com', 'linkedin.com', 'github.com', 'stackoverflow.com',
            'wikipedia.org', 'reddit.com', 'yahoo.com', 'bing.com'
        ];
        
        return trustedDomains.some(trusted => 
            domain === trusted || domain.endsWith('.' + trusted)
        );
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplePhishingDetector;
} else if (typeof window !== 'undefined') {
    window.SimplePhishingDetector = SimplePhishingDetector;
}