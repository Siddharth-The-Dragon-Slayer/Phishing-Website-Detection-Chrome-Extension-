import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import os
import re
from urllib.parse import urlparse

class PhishingDataProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = []
        
    def load_dataset(self, data_path='data/'):
        """
        Auto-detect and load phishing dataset from various formats
        """
        # Common dataset filenames
        possible_files = [
            'phishing_dataset.csv',
            'dataset_phishing.csv', 
            'phishing_websites.csv',
            'malicious_phish.csv',
            'urls.csv',
            'phishing.csv'
        ]
        
        dataset_file = None
        for filename in possible_files:
            filepath = os.path.join(data_path, filename)
            if os.path.exists(filepath):
                dataset_file = filepath
                break
        
        if not dataset_file:
            # List available files
            available_files = [f for f in os.listdir(data_path) if f.endswith('.csv')]
            if available_files:
                print(f"Available CSV files: {available_files}")
                dataset_file = os.path.join(data_path, available_files[0])
                print(f"Using: {dataset_file}")
            else:
                raise FileNotFoundError("No CSV dataset found in data/ folder")
        
        print(f"Loading dataset: {dataset_file}")
        df = pd.read_csv(dataset_file)
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        return df
    
    def detect_dataset_type(self, df):
        """
        Detect the type of phishing dataset and return processing strategy
        """
        columns = [col.lower() for col in df.columns]
        
        # Type 1: URL-based dataset
        if any('url' in col for col in columns):
            return 'url_based'
        
        # Type 2: Feature-based dataset (UCI style)
        elif len(df.columns) > 10 and any(col in columns for col in ['having_ip_address', 'url_length', 'shortining_service']):
            return 'feature_based'
        
        # Type 3: Mixed dataset
        elif any(col in columns for col in ['domain', 'path', 'query']):
            return 'mixed'
        
        # Type 4: Generic dataset
        else:
            return 'generic'
    
    def process_url_based_dataset(self, df):
        """
        Process dataset that contains raw URLs
        """
        # Find URL and label columns
        url_col = None
        label_col = None
        
        for col in df.columns:
            if 'url' in col.lower():
                url_col = col
            elif any(word in col.lower() for word in ['label', 'class', 'target', 'type', 'result']):
                label_col = col
        
        if not url_col:
            raise ValueError("No URL column found")
        if not label_col:
            raise ValueError("No label column found")
        
        print(f"URL column: {url_col}")
        print(f"Label column: {label_col}")
        
        # Extract features from URLs
        features_df = df[url_col].apply(self.extract_url_features)
        features_df = pd.DataFrame(features_df.tolist())
        
        # Process labels (binary for most models)
        labels_binary = self.process_labels(df[label_col], binary=True)
        labels_multi = self.process_labels(df[label_col], binary=False)
        
        return features_df, labels_binary, labels_multi
    
    def process_feature_based_dataset(self, df):
        """
        Process dataset that already contains extracted features
        """
        # Find label column
        label_col = None
        possible_label_names = ['class', 'target', 'label', 'result', 'phishing']
        
        for col in df.columns:
            if col.lower() in possible_label_names or col.lower().endswith('_class'):
                label_col = col
                break
        
        if not label_col:
            # Assume last column is label
            label_col = df.columns[-1]
        
        print(f"Label column: {label_col}")
        
        # Separate features and labels
        feature_cols = [col for col in df.columns if col != label_col]
        features_df = df[feature_cols].copy()
        labels_binary = self.process_labels(df[label_col], binary=True)
        labels_multi = self.process_labels(df[label_col], binary=False)
        
        return features_df, labels_binary, labels_multi
    
    def extract_url_features(self, url):
        """
        Extract features from a single URL
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            query = parsed.query
            
            features = {
                # URL length features
                'url_length': len(url),
                'domain_length': len(domain),
                'path_length': len(path),
                'query_length': len(query),
                
                # Security features
                'has_https': 1 if url.startswith('https://') else 0,
                'has_ip_address': 1 if re.search(r'\d+\.\d+\.\d+\.\d+', domain) else 0,
                
                # Domain features
                'subdomain_count': domain.count('.') - 1 if '.' in domain else 0,
                'domain_has_dash': 1 if '-' in domain else 0,
                
                # Suspicious TLD
                'suspicious_tld': 1 if any(domain.endswith(tld) for tld in ['.tk', '.ml', '.ga', '.cf']) else 0,
                
                # URL structure
                'url_depth': url.count('/') - 2,
                'has_query': 1 if query else 0,
                'has_fragment': 1 if '#' in url else 0,
                
                # Suspicious keywords
                'suspicious_keywords': sum(1 for keyword in ['secure', 'account', 'update', 'verify', 'login'] 
                                         if keyword in url.lower()),
                
                # Shortening services
                'is_shortened': 1 if any(short in domain for short in ['bit.ly', 'tinyurl', 't.co']) else 0,
                
                # Special characters
                'special_char_count': sum(1 for char in url if char in '@%&=?'),
                'digit_count': sum(1 for char in url if char.isdigit()),
                'letter_count': sum(1 for char in url if char.isalpha()),
            }
            
            return features
            
        except Exception as e:
            print(f"Error processing URL {url}: {e}")
            return {key: 0 for key in ['url_length', 'domain_length', 'path_length', 'query_length',
                                     'has_https', 'has_ip_address', 'subdomain_count', 'domain_has_dash',
                                     'suspicious_tld', 'url_depth', 'has_query', 'has_fragment',
                                     'suspicious_keywords', 'is_shortened', 'special_char_count',
                                     'digit_count', 'letter_count']}
    
    def process_labels(self, labels, binary=True):
        """
        Process and standardize labels 
        binary=True: Convert to binary (0=benign, 1=malicious)
        binary=False: Keep multi-class for classification tasks
        """
        # Convert to string for consistent processing
        labels = labels.astype(str).str.lower().str.strip()
        
        if binary:
            # Map to binary format (0=benign, 1=malicious)
            label_mapping = {
                # Benign/Safe
                'benign': 0, 'legitimate': 0, 'good': 0, 'safe': 0, 'normal': 0,
                '0': 0, '0.0': 0,
                
                # Malicious (phishing, malware, defacement)
                'phishing': 1, 'malware': 1, 'defacement': 1, 'malicious': 1, 
                'bad': 1, 'suspicious': 1, 'fraud': 1,
                '1': 1, '1.0': 1
            }
            
            processed_labels = []
            for label in labels:
                if label in label_mapping:
                    processed_labels.append(label_mapping[label])
                else:
                    # Default: if contains malicious keywords -> 1, else -> 0
                    if any(word in label for word in ['phish', 'malware', 'defacement', 'malicious', 'bad', 'fraud']):
                        processed_labels.append(1)
                    else:
                        processed_labels.append(0)
            
            return np.array(processed_labels)
        
        else:
            # Keep multi-class labels
            # Map to numeric classes: 0=benign, 1=phishing, 2=malware, 3=defacement
            label_mapping = {
                'benign': 0,
                'phishing': 1, 
                'malware': 2,
                'defacement': 3
            }
            
            processed_labels = []
            for label in labels:
                if label in label_mapping:
                    processed_labels.append(label_mapping[label])
                else:
                    processed_labels.append(0)  # Default to benign
            
            return np.array(processed_labels)
    
    def prepare_data(self, data_path='data/'):
        """
        Main method to load and prepare data for training
        """
        # Load dataset
        df = self.load_dataset(data_path)
        
        # Detect dataset type
        dataset_type = self.detect_dataset_type(df)
        print(f"Detected dataset type: {dataset_type}")
        
        # Process based on type
        if dataset_type == 'url_based':
            features_df, labels_binary, labels_multi = self.process_url_based_dataset(df)
        elif dataset_type == 'feature_based':
            features_df, labels_binary, labels_multi = self.process_feature_based_dataset(df)
        else:
            # Generic processing
            features_df, labels_binary, labels_multi = self.process_feature_based_dataset(df)
        
        # Clean features
        features_df = self.clean_features(features_df)
        
        # Store feature columns
        self.feature_columns = list(features_df.columns)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(features_df)
        
        print(f"Final feature shape: {X_scaled.shape}")
        print(f"Binary label distribution: {np.bincount(labels_binary)}")
        print(f"Multi-class label distribution: {np.bincount(labels_multi)}")
        
        return X_scaled, labels_binary, labels_multi, features_df.columns.tolist()
    
    def clean_features(self, df):
        """
        Clean and preprocess features
        """
        # Handle missing values
        df = df.fillna(0)
        
        # Convert boolean/categorical to numeric
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to convert to numeric
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            elif df[col].dtype == 'bool':
                df[col] = df[col].astype(int)
        
        # Remove constant columns
        constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
        if constant_cols:
            print(f"Removing constant columns: {constant_cols}")
            df = df.drop(columns=constant_cols)
        
        return df
    
    def split_data(self, X, y, test_size=0.2, random_state=42):
        """
        Split data into train and test sets
        """
        return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)

# Example usage
if __name__ == "__main__":
    processor = PhishingDataProcessor()
    
    try:
        X, y_binary, y_multi, feature_names = processor.prepare_data()
        X_train, X_test, y_train, y_test = processor.split_data(X, y_binary)
        
        print(f"Training set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        print(f"Feature names: {feature_names}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nPlease ensure you have a CSV file in the data/ folder")
        print("Supported formats:")
        print("1. URL-based: columns with 'url' and 'label'")
        print("2. Feature-based: pre-extracted features with target column")