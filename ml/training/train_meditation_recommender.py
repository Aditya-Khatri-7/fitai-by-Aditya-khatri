import os
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_meditation_recommender():
  print("[Model] Training Meditation Recommender Vector Space (real meditation.csv, 68 techniques)...")

  df = pd.read_csv(PROCESSED_DIR / "meditation_clean.csv")
  texts = df['text'].tolist()

  try:
    from sentence_transformers import SentenceTransformer
    print(" [SentenceTransformers] Encoding technique descriptions with all-MiniLM-L6-v2...")
    st_model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = st_model.encode(texts, show_progress_bar=False)
    encoder_type = "sentence_transformer"
  except Exception as e:
    print(f" [TF-IDF Fallback] SentenceTransformers error ({e}), using TF-IDF Vectorizer...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    embeddings = vectorizer.fit_transform(texts).toarray()
    joblib.dump(vectorizer, MODEL_DIR / "meditation_recommender_vectorizer.pkl")
    encoder_type = "tfidf"

  norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
  norms[norms == 0] = 1.0
  norm_embeddings = embeddings / norms

  np.save(MODEL_DIR / "meditation_embeddings.npy", norm_embeddings)
  joblib.dump(df.to_dict('records'), MODEL_DIR / "meditation_metadata.pkl")

  print(f"\n==================================================")
  print(f"   MEDITATION RECOMMENDER EVALUATION               ")
  print("==================================================")
  print(f" Encoder Type       : {encoder_type}")
  print(f" Embeddings Matrix  : {norm_embeddings.shape}")

  if encoder_type == "sentence_transformer":
    q_emb = st_model.encode(["quick technique to calm down after a stressful high-intensity workout"])[0]
  else:
    q_emb = vectorizer.transform(["quick technique to calm down after a stressful high-intensity workout"]).toarray()[0]
  q_norm = q_emb / (np.linalg.norm(q_emb) or 1.0)
  sims = np.dot(norm_embeddings, q_norm)
  top_idx = np.argsort(sims)[::-1][:3]
  for idx in top_idx:
    print(f"   -> Top Match: {df.iloc[idx]['title']} (Score: {sims[idx]:.4f})")
  print("==================================================\n")

  print(f" [SAVED] Embeddings: meditation_embeddings.npy & Metadata: meditation_metadata.pkl")
  return {"count": len(df)}

if __name__ == "__main__":
  train_meditation_recommender()
