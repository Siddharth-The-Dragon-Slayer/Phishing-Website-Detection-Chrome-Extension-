# Dataset Integration Guide

## How to Add Your Kaggle Dataset

### Step 1: Download Dataset
1. Download your phishing dataset from Kaggle
2. Extract the CSV file(s)
3. Place them in this `data/` folder

### Step 2: Supported Dataset Formats

#### Option A: Standard Phishing Dataset
- File: `phishing_dataset.csv`
- Expected columns: features + target column (0=legitimate, 1=phishing)

#### Option B: URL Dataset
- File: `urls_dataset.csv` 
- Expected columns: `url`, `label` (or similar)

#### Option C: Custom Dataset
- Any CSV with features and target column
- Update `data_processor.py` with your column names

### Step 3: Run Training
```bash
cd phishing-detector-extension
python train_models.py
```

### Common Dataset Names:
- `phishing_dataset.csv`
- `dataset_phishing.csv` 
- `phishing_websites.csv`
- `malicious_phish.csv`
- `urls.csv`

Just drop your CSV file here and run the training script!