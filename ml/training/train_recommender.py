import os
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_recommender():
  print("[Model 3/3] Training Exercise Recommender Sentence-Transformers Vector Space...")

  exercises_df = pd.read_csv(PROCESSED_DIR / "exercises_clean.csv")
  texts = exercises_df['text'].tolist()

  try:
    from sentence_transformers import SentenceTransformer
    print(" [SentenceTransformers] Encoding texts with all-MiniLM-L6-v2...")
    st_model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = st_model.encode(texts, show_progress_bar=False)
    encoder_type = "sentence_transformer"
  except Exception as e:
    print(f" [TF-IDF Fallback] SentenceTransformers error ({e}), using TF-IDF Vectorizer...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    embeddings = vectorizer.fit_transform(texts).toarray()
    joblib.dump(vectorizer, MODEL_DIR / "recommender_vectorizer.pkl")
    encoder_type = "tfidf"

  # Normalize embeddings for cosine similarity (dot product)
  norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
  norms[norms == 0] = 1.0
  norm_embeddings = embeddings / norms

  # Save embeddings + metadata
  np.save(MODEL_DIR / "exercise_embeddings.npy", norm_embeddings)
  joblib.dump(exercises_df.to_dict('records'), MODEL_DIR / "exercise_metadata.pkl")

  print(f"\n==================================================")
  print(f"   EXERCISE RECOMMENDER MODEL EVALUATION          ")
  print("==================================================")
  print(f" Encoder Type       : {encoder_type}")
  print(f" Embeddings Matrix  : {norm_embeddings.shape}")
  print(" Sample Test Query 1: 'chest exercise for beginner with dumbbell'")
  
  # Perform sample test query search
  if encoder_type == "sentence_transformer":
    q_emb = st_model.encode(["chest exercise for beginner with dumbbell"])[0]
  else:
    q_emb = vectorizer.transform(["chest exercise for beginner with dumbbell"]).toarray()[0]
  
  q_norm = q_emb / (np.linalg.norm(q_emb) or 1.0)
  sims = np.dot(norm_embeddings, q_norm)
  top_idx = np.argsort(sims)[::-1][:3]

  for idx in top_idx:
    print(f"   -> Top Match: {exercises_df.iloc[idx]['name']} (Score: {sims[idx]:.4f})")
  print("==================================================\n")

  print(f" [SAVED] Embeddings: exercise_embeddings.npy & Metadata: exercise_metadata.pkl")
  return {"count": len(exercises_df)}

if __name__ == "__main__":
  train_recommender()
