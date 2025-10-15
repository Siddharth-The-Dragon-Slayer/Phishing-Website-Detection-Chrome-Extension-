/**
 * Model Loader for Chrome Extension
 * Loads trained models and provides prediction interface
 */

class ModelLoader {
    constructor() {
        this.models = {};
        this.metrics = {};
        this.featureNames = [];
        this.isLoaded = false;
    }
    
    async loadModels() {
        try {
            // Load model metadata
            const metricsResponse = await fetch(chrome.runtime.getURL('models/metrics.json'));
            this.metrics = await metricsResponse.json();
            
            const featuresResponse = await fetch(chrome.runtime.getURL('models/feature_names.json'));
            this.featureNames = await featuresResponse.json();
            
            // Load simplified model parameters (since we can't load sklearn models directly in browser)
            await this.loadSimplifiedModels();
            
            this.isLoaded = true;
            console.log('Models loaded successfully');
            
        } catch (error) {
            console.error('Error loading models:', error);
            // Fallback to rule-based detection
            this.loadFallbackModels();
        }
    }
    
    async loadSimplifiedModels() {
        // Since we can't load sklearn models in browser, we'll use the trained parameters
        // to create simplified JavaScript versions
        
        // Decision Tree - Use feature importance and thresholds
        this.models.decisionTree = {
            featureImportance: this.metrics.decision_tree?.feature_importance || [],
            predict: (features) => this.decisionTreePredict(features)
        };
        
        // Regression - Use feature importance for scoring
        this.models.regression = {
            featureImportance: this.metrics.regression?.feature_importance || [],
            predict: (features) => this.regressionPredict(features)
        };
        
        // Classification - Multi-class prediction
        this.models.classification = {
            featureImportance: this.metrics.classification?.feature_importance || [],
            predict: (features) => this.classificationPredict(features)
        };
        
        // Clustering - Use cluster centers
        this.models.clustering = {
            clusterCenters: this.metrics.clustering?.cluster_centers || [],
            nClusters: this.metrics.clustering?.n_clusters || 3,
            predict: (features) => this.clusteringPredict(features)
        };
    }
    
    loadFallbackModels() {
        // Fallback rule-based models if trained models can't be loaded
        console.log('Loading fallback rule-based models');
        
        this.models.decisionTree = {
            predict: (features) => this.fallbackDecisionTree(features)
        };
        
        this.models.regression = {
            predict: (features) => this.fallbackRegression(features)
        };
        
        this.models.classification = {
            predict: (features) => this.fallbackClassification(features)
        };
        
        this.models.clustering = {
            predict: (features) => this.fallbackClustering(features)
        };
        
        this.isLoaded = true;
    }
    
    decisionTreePredict(features) {
        if (!this.models.decisionTree.featureImportance.length) {
            return this.fallbackDecisionTree(features);
        }
        
        // Weighted scoring based on feature importance
        let score = 0;
        const importance = this.models.decisionTree.featureImportance;
        
        for (let i = 0; i < Math.min(features.length, importance.length); i++) {
            score += features[i] * importance[i];
        }
        
        return score > 0.5 ? 'phishing' : 'legitimate';
    }
    
    regressionPredict(features) {
        if (!this.models.regression.featureImportance.length) {
            return this.fallbackRegression(features);
        }
        
        // Weighted risk score calculation
        let riskScore = 0;
        const importance = this.models.regression.featureImportance;
        
        for (let i = 0; i < Math.min(features.length, importance.length); i++) {
            riskScore += features[i] * importance[i];
        }
        
        return Math.min(Math.max(riskScore, 0), 1);
    }
    
    classificationPredict(features) {
        const riskScore = this.regressionPredict(features);
        
        if (riskScore >= 0.7) return 'high_risk';
        if (riskScore >= 0.3) return 'medium_risk';
        return 'low_risk';
    }
    
    clusteringPredict(features) {
        if (!this.models.clustering.clusterCenters.length) {
            return this.fallbackClustering(features);
        }
        
        // Find nearest cluster center
        let minDistance = Infinity;
        let nearestCluster = 0;
        
        for (let i = 0; i < this.models.clustering.clusterCenters.length; i++) {
            const center = this.models.clustering.clusterCenters[i];
            let distance = 0;
            
            for (let j = 0; j < Math.min(features.length, center.length); j++) {
                distance += Math.pow(features[j] - center[j], 2);
            }
            
            distance = Math.sqrt(distance);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestCluster = i;
            }
        }
        
        return {
            cluster: nearestCluster,
            distance: minDistance,
            confidence: Math.max(0, 1 - minDistance / 10) // Normalize confidence
        };
    }
    
    // Fallback rule-based predictions
    fallbackDecisionTree(features) {
        // Simple rule-based decision tree
        const [urlLength, domainLength, hasHttps, hasIP, suspiciousTLD, 
               urlDepth, hasShortening, suspiciousKeywords] = features;
        
        let score = 0;
        
        if (!hasHttps) score += 0.3;
        if (hasIP) score += 0.4;
        if (suspiciousTLD) score += 0.3;
        if (suspiciousKeywords > 2) score += 0.2;
        if (urlLength > 100) score += 0.2;
        if (hasShortening) score += 0.3;
        
        return score > 0.5 ? 'phishing' : 'legitimate';
    }
    
    fallbackRegression(features) {
        const [urlLength, domainLength, hasHttps, hasIP, suspiciousTLD, 
               urlDepth, hasShortening, suspiciousKeywords] = features;
        
        let riskScore = 0;
        
        // URL security features (40% weight)
        if (!hasHttps) riskScore += 0.15;
        if (hasIP) riskScore += 0.20;
        if (urlLength > 100) riskScore += 0.05;
        
        // Domain features (30% weight)
        if (suspiciousTLD) riskScore += 0.15;
        if (hasShortening) riskScore += 0.15;
        
        // Content features (30% weight)
        if (suspiciousKeywords > 2) riskScore += 0.10;
        if (urlDepth > 5) riskScore += 0.10;
        if (suspiciousKeywords > 0) riskScore += 0.10;
        
        return Math.min(riskScore, 1.0);
    }
    
    fallbackClassification(features) {
        const riskScore = this.fallbackRegression(features);
        
        if (riskScore >= 0.7) return 'high_risk';
        if (riskScore >= 0.3) return 'medium_risk';
        return 'low_risk';
    }
    
    fallbackClustering(features) {
        const [urlLength, domainLength, hasHttps, hasIP, suspiciousTLD] = features;
        
        // Simple clustering based on security profile
        if (hasHttps && !hasIP && !suspiciousTLD) {
            return { cluster: 0, confidence: 0.9, type: 'trusted' };
        } else if (hasIP || suspiciousTLD) {
            return { cluster: 2, confidence: 0.8, type: 'suspicious' };
        } else {
            return { cluster: 1, confidence: 0.6, type: 'unknown' };
        }
    }
    
    // Main prediction interface
    async predict(features) {
        if (!this.isLoaded) {
            await this.loadModels();
        }
        
        try {
            const predictions = {
                decisionTree: this.models.decisionTree.predict(features),
                regression: this.models.regression.predict(features),
                classification: this.models.classification.predict(features),
                clustering: this.models.clustering.predict(features)
            };
            
            // Calculate overall risk assessment
            const riskScore = predictions.regression;
            const riskLevel = this.getRiskLevel(riskScore);
            
            return {
                prediction: predictions.decisionTree,
                riskScore: riskScore,
                riskLevel: riskLevel,
                algorithms: predictions,
                confidence: this.calculateConfidence(predictions)
            };
            
        } catch (error) {
            console.error('Prediction error:', error);
            return {
                prediction: 'unknown',
                riskScore: 0.5,
                riskLevel: 'medium',
                error: error.message
            };
        }
    }
    
    getRiskLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }
    
    calculateConfidence(predictions) {
        // Simple confidence calculation based on agreement between models
        const riskScore = predictions.regression;
        const dtRisk = predictions.decisionTree === 'phishing' ? 1 : 0;
        const clsRisk = predictions.classification === 'high_risk' ? 1 : 
                       predictions.classification === 'medium_risk' ? 0.5 : 0;
        
        // Agreement between models increases confidence
        const agreement = Math.abs(riskScore - dtRisk) + Math.abs(riskScore - clsRisk);
        const confidence = Math.max(0.5, 1 - agreement / 2);
        
        return confidence;
    }
    
    getModelMetrics() {
        return this.metrics;
    }
    
    getFeatureNames() {
        return this.featureNames;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelLoader;
} else if (typeof window !== 'undefined') {
    window.ModelLoader = ModelLoader;
}