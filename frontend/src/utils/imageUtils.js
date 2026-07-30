/**
 * Resizes an image file to a small JPEG and returns it as base64 (no data-URL
 * prefix) — used by any feature that sends a photo to the ML service's
 * base64-in-JSON image endpoints (yoga pose check, meal photo logging).
 */
export function fileToResizedBase64(file, maxDim = 224) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
