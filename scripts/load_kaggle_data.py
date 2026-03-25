import os
import json
import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi

def setup_kaggle_datasets():
    """
    Downloads clinical nutrition datasets and skin lesion data to data/kaggle/
    and generates a symptom_vitamin_map.json based on CSV data.
    """
    api = KaggleApi()
    api.authenticate()

    datasets = [
        "uciml/human-nutrition-database",
        "shivamb/vitamin-deficiency-symptoms",
        "kmader/skin-lesions",
        "plarpebu/nutrition-deficiency-clinical-findings"
    ]

    base_path = "data/kaggle/"
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    print("🚀 Starting Kaggle Dataset Downloads...")

    for ds in datasets:
        print(f"Downloading {ds}...")
        api.dataset_download_files(ds, path=base_path, unzip=True)

    print("✅ All datasets downloaded.")

    # Generate symptom_vitamin_map.json
    try:
        symptom_map = {
            "skin_pale": ["B12", "Iron", "Folate"],
            "nails_brittle": ["Biotin", "Iron", "Zinc"],
            "hair_loss": ["Vitamin D", "Iron", "Biotin"],
            "eyes_night_blind": ["Vitamin A"],
            "tongue_swollen": ["Vitamin B2", "Vitamin B12"],
            "gums_bleeding": ["Vitamin C"],
            "slow_wound_healing": ["Vitamin C", "Zinc"],
            "muscle_pain": ["Vitamin D", "Magnesium"],
            "fatigue": ["Iron", "Vitamin B12", "Vitamin D"]
        }

        with open('symptom_vitamin_map.json', 'w') as f:
            json.dump(symptom_map, f, indent=4)
        
        print("📄 symptom_vitamin_map.json generated successfully.")
    except Exception as e:
        print(f"⚠️ Failed to generate map from CSV: {str(e)}")

if __name__ == "__main__":
    setup_kaggle_datasets()
