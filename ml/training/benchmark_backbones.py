"""Head-to-head: MobileNetV2 vs ResNet-18 (frozen ImageNet backbone, same head-only
training protocol, same splits/epochs/lr) on the yoga and food datasets.
Reports test accuracy, weighted F1, parameter count, checkpoint size, CPU latency."""
import sys, json, time, io
import numpy as np
import pandas as pd
import joblib
import torch
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
import cnn_common
from cnn_common import train_image_classifier, build_model, ManifestImageDataset

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED = BASE_DIR / "datasets" / "processed"
OUT = BASE_DIR / "ml" / "models" / "backbone_benchmark.json"
STALE_ROOT = "D:/Projects/fitai/"
torch.manual_seed(42); np.random.seed(42)

def load(name, split):
  df = pd.read_csv(PROCESSED / f"{name}_{split}_manifest.csv")
  df["filepath"] = df["filepath"].str.replace("\\", "/", regex=False).str.replace(STALE_ROOT, BASE_DIR.as_posix() + "/", regex=False)
  return df

def size_mb(model):
  buf = io.BytesIO(); torch.save(model.state_dict(), buf); return buf.getbuffer().nbytes / 1e6

def cpu_latency_ms(model, runs=50):
  model.eval(); x = torch.randn(1, 3, cnn_common.IMG_SIZE, cnn_common.IMG_SIZE)
  with torch.no_grad():
    for _ in range(10): model(x)
    ts = []
    for _ in range(runs):
      t = time.perf_counter(); model(x); ts.append((time.perf_counter() - t) * 1000)
  return float(np.median(ts))

cfg = {"yoga": dict(epochs=8), "food": dict(epochs=12)}
results = {}
for ds, kw in cfg.items():
  tr, va, te = load(ds, "train"), load(ds, "val"), load(ds, "test")
  classes = joblib.load(PROCESSED / f"{ds}_classes.pkl")
  for arch in ["mobilenet_v2", "resnet18"]:
    r = train_image_classifier(f"{ds}/{arch}", tr, va, te, classes, batch_size=32, arch=arch, **kw)
    m = r["model"]
    results[f"{ds}_{arch}"] = {
      "test_accuracy": r["test_accuracy"], "f1": r["f1"],
      "total_params_m": sum(p.numel() for p in m.parameters()) / 1e6,
      "checkpoint_mb": size_mb(m), "cpu_latency_ms": cpu_latency_ms(m),
      "test_n": len(te), "classes": len(classes), "epochs": kw["epochs"]}
    OUT.write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))