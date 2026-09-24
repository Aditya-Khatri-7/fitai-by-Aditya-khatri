import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image, ImageFile
from pathlib import Path

# Real Kaggle image datasets occasionally ship a handful of truncated/corrupt
# JPEGs — load whatever bytes are readable instead of erroring out mid-epoch.
ImageFile.LOAD_TRUNCATED_IMAGES = True
from sklearn.metrics import f1_score, confusion_matrix
import torchvision.models as tv_models
import torchvision.transforms as T

IMG_SIZE = 160
_TRANSFORM = T.Compose([
  T.Resize((IMG_SIZE, IMG_SIZE)),
  T.ToTensor(),
  T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # ImageNet stats, matches the pretrained backbone
])


class ManifestImageDataset(Dataset):
  def __init__(self, manifest_df, class_to_idx):
    self.paths = manifest_df['filepath'].tolist()
    self.labels = [class_to_idx[l] for l in manifest_df['label'].tolist()]

  def __len__(self):
    return len(self.paths)

  def __getitem__(self, idx):
    img = Image.open(self.paths[idx]).convert('RGB')
    return _TRANSFORM(img), self.labels[idx]


def build_model(num_classes, arch='mobilenet_v2'):
  # Frozen ImageNet-pretrained backbone + a small trainable head — the only
  # CPU-feasible approach for these dataset sizes (no GPU available). Only the
  # final classifier layer is trained. MobileNetV2 is the shipped default;
  # ResNet-18 is supported for the head-to-head in benchmark_backbones.py.
  if arch == 'mobilenet_v2':
    model = tv_models.mobilenet_v2(weights=tv_models.MobileNet_V2_Weights.IMAGENET1K_V1)
    for param in model.features.parameters():
      param.requires_grad = False
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
  elif arch == 'resnet18':
    model = tv_models.resnet18(weights=tv_models.ResNet18_Weights.IMAGENET1K_V1)
    for param in model.parameters():
      param.requires_grad = False
    model.fc = nn.Linear(model.fc.in_features, num_classes)
  else:
    raise ValueError(f"Unknown arch: {arch}")
  return model


def head_parameters(model):
  return [p for p in model.parameters() if p.requires_grad]


def train_image_classifier(display_name, train_df, val_df, test_df, class_names, epochs=10, batch_size=32, lr=1e-3, arch='mobilenet_v2'):
  print(f"[Model] Training {display_name} ({arch} transfer learning, CPU, {len(class_names)} classes)...")
  class_to_idx = {c: i for i, c in enumerate(class_names)}

  train_loader = DataLoader(ManifestImageDataset(train_df, class_to_idx), batch_size=batch_size, shuffle=True, num_workers=0)
  val_loader = DataLoader(ManifestImageDataset(val_df, class_to_idx), batch_size=batch_size, shuffle=False, num_workers=0)
  test_loader = DataLoader(ManifestImageDataset(test_df, class_to_idx), batch_size=batch_size, shuffle=False, num_workers=0)

  model = build_model(len(class_names), arch)
  optimizer = torch.optim.Adam(head_parameters(model), lr=lr)
  criterion = nn.CrossEntropyLoss()

  best_val_acc = 0.0
  best_state = None
  start = time.time()

  for epoch in range(epochs):
    model.train()
    total_loss = 0.0
    for images, labels in train_loader:
      optimizer.zero_grad()
      outputs = model(images)
      loss = criterion(outputs, labels)
      loss.backward()
      optimizer.step()
      total_loss += loss.item() * images.size(0)

    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
      for images, labels in val_loader:
        preds = model(images).argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    val_acc = correct / max(total, 1)
    print(f"  Epoch {epoch + 1}/{epochs} — train loss: {total_loss / len(train_loader.dataset):.4f}, val acc: {val_acc:.4f}")

    if val_acc >= best_val_acc:
      best_val_acc = val_acc
      best_state = {k: v.clone() for k, v in model.state_dict().items()}

  if best_state is not None:
    model.load_state_dict(best_state)

  model.eval()
  all_preds, all_labels = [], []
  with torch.no_grad():
    for images, labels in test_loader:
      preds = model(images).argmax(dim=1)
      all_preds.extend(preds.tolist())
      all_labels.extend(labels.tolist())

  test_acc = float(np.mean(np.array(all_preds) == np.array(all_labels)))
  f1 = f1_score(all_labels, all_preds, average='weighted')
  cm = confusion_matrix(all_labels, all_preds, labels=list(range(len(class_names))))
  elapsed = time.time() - start

  print(f"  [DONE] Test accuracy: {test_acc:.4f}, weighted F1: {f1:.4f} ({elapsed:.1f}s)")

  return {
    "model": model,
    "test_accuracy": test_acc,
    "f1": f1,
    "confusion_matrix": cm,
    "class_names": class_names
  }
