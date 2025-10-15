import numpy as np
import pandas as pd
import joblib
import json
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, silhouette_score
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt
import seaborn as sns
from data_processor import PhishingDataProcessor
import os

class PhishingModelTrainer:
    def __init__(self):
        self.models = {}
        self.metrics = {}
        self.feature_names = []
        
    def train_all_models(self, X_train, X_test, y_train_binary, y_test_binary, y_train_multi, y_test_multi, feature_names):
        """
        Train all DMBI models: Decision Tree, Regression, Classification, Clustering
        """
        self.feature_names = feature_names
        
        print("🌳 Training Decision Tree Model...")
        self.train_decision_tree(X_train, X_test, y_train_binary, y_test_binary)
        
        print("📈 Training Regression Model...")
        self.train_regression(X_train, X_test, y_train_binary, y_test_binary)
        
        print("🎯 Training Classification Model...")
        self.train_classification(X_train, X_test, y_train_multi, y_test_multi)
        
        print("🔗 Training Clustering Model...")
        self.train_clustering(X_train, X_test, y_train_binary, y_test_binary)
        
        print("💾 Saving Models...")
        self.save_models()
        
        print("📊 Generating Reports...")
        self.generate_reports()
    
    def train_decision_tree(self, X_train, X_test, y_train, y_test):
        """
        Train Decision Tree for binary classification
        """
        # Train model
        dt_model = DecisionTreeClassifier(
            max_depth=10,
            min_samples_split=20,
            min_samples_leaf=10,
            random_state=42
        )
        
        dt_model.fit(X_train, y_train)
        
        # Predictions
        y_pred_train = dt_model.predict(X_train)
        y_pred_test = dt_model.predict(X_test)
        
        # Metrics
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        # Cross-validation
        cv_scores = cross_val_score(dt_model, X_train, y_train, cv=5)
        
        self.models['decision_tree'] = dt_model
        self.metrics['decision_tree'] = {
            'train_accuracy': train_acc,
            'test_accuracy': test_acc,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'feature_importance': dt_model.feature_importances_.tolist(),
            'tree_depth': dt_model.get_depth(),
            'n_leaves': dt_model.get_n_leaves()
        }
        
        print(f"   ✅ Decision Tree - Test Accuracy: {test_acc:.4f}")
        print(f"   📏 Tree Depth: {dt_model.get_depth()}, Leaves: {dt_model.get_n_leaves()}")
    
    def train_regression(self, X_train, X_test, y_train, y_test):
        """
        Train Regression model for risk score prediction
        """
        # Convert binary labels to risk scores (0-1 range with some noise for regression)
        y_train_reg = y_train.astype(float) + np.random.normal(0, 0.1, len(y_train))
        y_train_reg = np.clip(y_train_reg, 0, 1)
        
        y_test_reg = y_test.astype(float) + np.random.normal(0, 0.1, len(y_test))
        y_test_reg = np.clip(y_test_reg, 0, 1)
        
        # Train Random Forest Regressor
        rf_reg = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        rf_reg.fit(X_train, y_train_reg)
        
        # Predictions
        y_pred_train = rf_reg.predict(X_train)
        y_pred_test = rf_reg.predict(X_test)
        
        # Metrics
        train_mse = mean_squared_error(y_train_reg, y_pred_train)
        test_mse = mean_squared_error(y_test_reg, y_pred_test)
        train_r2 = rf_reg.score(X_train, y_train_reg)
        test_r2 = rf_reg.score(X_test, y_test_reg)
        
        self.models['regression'] = rf_reg
        self.metrics['regression'] = {
            'train_mse': train_mse,
            'test_mse': test_mse,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'feature_importance': rf_reg.feature_importances_.tolist()
        }
        
        print(f"   ✅ Regression - Test R²: {test_r2:.4f}, MSE: {test_mse:.4f}")
    
    def train_classification(self, X_train, X_test, y_train, y_test):
        """
        Train multi-class classification using the actual dataset classes
        """
        # Train Random Forest Classifier for multi-class
        rf_clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            random_state=42
        )
        
        rf_clf.fit(X_train, y_train)
        
        # Predictions
        y_pred_train = rf_clf.predict(X_train)
        y_pred_test = rf_clf.predict(X_test)
        
        # Metrics
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        # Cross-validation
        cv_scores = cross_val_score(rf_clf, X_train, y_train, cv=3)  # Reduced CV for large dataset
        
        # Class names mapping
        class_names = {0: 'benign', 1: 'phishing', 2: 'malware', 3: 'defacement'}
        
        self.models['classification'] = rf_clf
        self.metrics['classification'] = {
            'train_accuracy': train_acc,
            'test_accuracy': test_acc,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'feature_importance': rf_clf.feature_importances_.tolist(),
            'n_classes': len(np.unique(y_train)),
            'class_distribution': np.bincount(y_train).tolist(),
            'class_names': class_names
        }
        
        print(f"   ✅ Classification - Test Accuracy: {test_acc:.4f}")
        print(f"   📊 Classes: {len(np.unique(y_train))} (benign, phishing, malware, defacement)")
        print(f"   🎯 CV Score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    def train_clustering(self, X_train, X_test, y_train, y_test):
        """
        Train clustering model for pattern detection
        """
        # Determine optimal number of clusters
        silhouette_scores = []
        K_range = range(2, 8)
        
        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(X_train)
            silhouette_avg = silhouette_score(X_train, cluster_labels)
            silhouette_scores.append(silhouette_avg)
        
        # Choose best K
        best_k = K_range[np.argmax(silhouette_scores)]
        
        # Train final model
        kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        kmeans.fit(X_train)
        
        # Get cluster assignments
        train_clusters = kmeans.predict(X_train)
        test_clusters = kmeans.predict(X_test)
        
        # Calculate metrics
        train_silhouette = silhouette_score(X_train, train_clusters)
        test_silhouette = silhouette_score(X_test, test_clusters)
        
        # Analyze cluster-label correlation
        cluster_purity = self.calculate_cluster_purity(train_clusters, y_train)
        
        self.models['clustering'] = kmeans
        self.metrics['clustering'] = {
            'n_clusters': best_k,
            'train_silhouette': train_silhouette,
            'test_silhouette': test_silhouette,
            'cluster_centers': kmeans.cluster_centers_.tolist(),
            'cluster_purity': cluster_purity,
            'inertia': kmeans.inertia_
        }
        
        print(f"   ✅ Clustering - Optimal K: {best_k}, Silhouette: {test_silhouette:.4f}")
    
    def calculate_cluster_purity(self, clusters, labels):
        """
        Calculate purity of clusters with respect to true labels
        """
        cluster_purity = {}
        for cluster_id in np.unique(clusters):
            cluster_mask = clusters == cluster_id
            cluster_labels = labels[cluster_mask]
            if len(cluster_labels) > 0:
                purity = np.max(np.bincount(cluster_labels)) / len(cluster_labels)
                cluster_purity[int(cluster_id)] = float(purity)
        
        return cluster_purity
    
    def save_models(self):
        """
        Save trained models and metadata
        """
        os.makedirs('models', exist_ok=True)
        
        # Save models
        for name, model in self.models.items():
            joblib.dump(model, f'models/{name}_model.pkl')
        
        # Save metrics
        with open('models/metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        # Save feature names
        with open('models/feature_names.json', 'w') as f:
            json.dump(self.feature_names, f)
        
        print("   💾 Models saved to models/ directory")
    
    def generate_reports(self):
        """
        Generate visualization reports
        """
        os.makedirs('reports', exist_ok=True)
        
        # Feature importance comparison
        self.plot_feature_importance()
        
        # Model performance comparison
        self.plot_model_performance()
        
        # Generate summary report
        self.generate_summary_report()
    
    def plot_feature_importance(self):
        """
        Plot feature importance for tree-based models
        """
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Feature Importance Comparison', fontsize=16)
        
        models_with_importance = ['decision_tree', 'regression', 'classification']
        
        for i, model_name in enumerate(models_with_importance):
            if model_name in self.metrics:
                importance = self.metrics[model_name]['feature_importance']
                
                # Get top 10 features
                top_indices = np.argsort(importance)[-10:]
                top_features = [self.feature_names[i] for i in top_indices]
                top_importance = [importance[i] for i in top_indices]
                
                ax = axes[i//2, i%2]
                ax.barh(range(len(top_features)), top_importance)
                ax.set_yticks(range(len(top_features)))
                ax.set_yticklabels(top_features)
                ax.set_title(f'{model_name.replace("_", " ").title()}')
                ax.set_xlabel('Importance')
        
        # Remove empty subplot
        axes[1, 1].remove()
        
        plt.tight_layout()
        plt.savefig('reports/feature_importance.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def plot_model_performance(self):
        """
        Plot model performance comparison
        """
        fig, axes = plt.subplots(1, 2, figsize=(12, 5))
        
        # Accuracy comparison
        models = ['decision_tree', 'classification']
        accuracies = [self.metrics[model]['test_accuracy'] for model in models if model in self.metrics]
        model_names = [model.replace('_', ' ').title() for model in models if model in self.metrics]
        
        axes[0].bar(model_names, accuracies, color=['skyblue', 'lightcoral'])
        axes[0].set_title('Model Accuracy Comparison')
        axes[0].set_ylabel('Test Accuracy')
        axes[0].set_ylim(0, 1)
        
        # Add value labels on bars
        for i, v in enumerate(accuracies):
            axes[0].text(i, v + 0.01, f'{v:.3f}', ha='center', va='bottom')
        
        # R² score for regression
        if 'regression' in self.metrics:
            r2_score = self.metrics['regression']['test_r2']
            axes[1].bar(['Regression'], [r2_score], color='lightgreen')
            axes[1].set_title('Regression R² Score')
            axes[1].set_ylabel('R² Score')
            axes[1].set_ylim(0, 1)
            axes[1].text(0, r2_score + 0.01, f'{r2_score:.3f}', ha='center', va='bottom')
        
        plt.tight_layout()
        plt.savefig('reports/model_performance.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_summary_report(self):
        """
        Generate text summary report
        """
        with open('reports/training_summary.txt', 'w') as f:
            f.write("DMBI Phishing Detection - Model Training Summary\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"Dataset Information:\n")
            f.write(f"- Number of features: {len(self.feature_names)}\n")
            f.write(f"- Feature names: {', '.join(self.feature_names[:10])}{'...' if len(self.feature_names) > 10 else ''}\n\n")
            
            for model_name, metrics in self.metrics.items():
                f.write(f"{model_name.replace('_', ' ').title()} Model:\n")
                f.write("-" * 30 + "\n")
                
                if 'test_accuracy' in metrics:
                    f.write(f"Test Accuracy: {metrics['test_accuracy']:.4f}\n")
                if 'test_r2' in metrics:
                    f.write(f"Test R²: {metrics['test_r2']:.4f}\n")
                if 'test_silhouette' in metrics:
                    f.write(f"Silhouette Score: {metrics['test_silhouette']:.4f}\n")
                if 'n_clusters' in metrics:
                    f.write(f"Optimal Clusters: {metrics['n_clusters']}\n")
                
                f.write("\n")
        
        print("   📊 Reports generated in reports/ directory")

def main():
    print("🚀 Starting DMBI Phishing Detection Model Training")
    print("=" * 50)
    
    # Initialize processor and trainer
    processor = PhishingDataProcessor()
    trainer = PhishingModelTrainer()
    
    try:
        # Load and process data
        print("📂 Loading and processing dataset...")
        X, y_binary, y_multi, feature_names = processor.prepare_data()
        
        # Split data
        print("✂️ Splitting data...")
        X_train, X_test, y_train_binary, y_test_binary = processor.split_data(X, y_binary)
        _, _, y_train_multi, y_test_multi = processor.split_data(X, y_multi)
        
        print(f"Training samples: {len(X_train)}")
        print(f"Test samples: {len(X_test)}")
        print(f"Features: {len(feature_names)}")
        print(f"Binary classes: {len(np.unique(y_binary))}")
        print(f"Multi classes: {len(np.unique(y_multi))}")
        print()
        
        # Train all models
        trainer.train_all_models(X_train, X_test, y_train_binary, y_test_binary, 
                               y_train_multi, y_test_multi, feature_names)
        
        print("\n🎉 Training completed successfully!")
        print("📁 Check the following directories:")
        print("   - models/ : Trained model files")
        print("   - reports/ : Performance reports and visualizations")
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure your dataset CSV is in the data/ folder")
        print("2. Check that the dataset has proper columns")
        print("3. Verify the dataset format matches expected structure")

if __name__ == "__main__":
    main()