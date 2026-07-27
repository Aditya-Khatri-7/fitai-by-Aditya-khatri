# 3D Exercise Animation Setup

The FitAI application includes interactive 3D exercise motion demos rendered via `@react-three/fiber` and `@react-three/drei`.

The app checks this directory (`models_3d/`) for the following `.glb` animation files:
- `pushup.glb`
- `squat.glb`
- `deadlift.glb`
- `benchpress.glb`
- `bicep_curl.glb`
- `shoulder_press.glb`
- `lunge.glb`
- `plank.glb`
- `burpee.glb`
- `jumping_jack.glb`

## How to Download Character Animations (FREE, ~5-10 minutes):

1. Go to [Mixamo](https://www.mixamo.com) and sign in with a free Adobe account.
2. Click **"Characters"** → Select **"Y Bot"** (recommended for clean metallic studio look).
3. Click **"Animations"** → Search for each exercise name:
   - Search `"Push Up"` → Download → Format: **glTF Binary (.glb)** → With Skin → 30 FPS.
   - Repeat for: Squat, Deadlift, Bench Press, Bicep Curl, Shoulder Press, Lunge, Plank.
4. Rename files to match the filenames above (`pushup.glb`, `squat.glb`, etc.).
5. Place all `.glb` files into this directory (`d:\Projects\fitai\models_3d\`).

*Note: The frontend includes an automatic 2D animated SVG fallback guide for any exercises where a custom `.glb` model is not present.*
