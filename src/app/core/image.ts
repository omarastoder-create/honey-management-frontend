/**
 * Shrinks a photo in the browser before uploading it (smaller, faster uploads)
 * and converts it to JPEG, which the backend accepts.
 */
export function compressImage(file: File, maxSize: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      // Scale so the longer side is at most maxSize (also for square images).
      const scale = Math.min(1, maxSize / img.width, maxSize / img.height);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas API nicht unterstützt.'));
        return;
      }
      // JPEG has no transparency: paint a white background first.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Bild konnte nicht komprimiert werden.'));
            return;
          }
          const name = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
}
