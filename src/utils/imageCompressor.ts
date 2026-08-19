/**
 * Image compressor utility for Corporación TCT attachments.
 * Scales down large camera captures (which can be 5-20MB) to optimized web JPEG (~80-150KB),
 * preserving sharp readability for vouchers, receipts, and field contracts without overflowing memory or storage quotas.
 */

export const compressImageFile = async (
  file: File,
  maxDimension = 1200,
  quality = 0.75
): Promise<{ dataUrl: string; sizeFormatted: string }> => {
  return new Promise((resolve) => {
    // If not an image (e.g., PDF or document), read standard data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const sizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;
        resolve({ dataUrl, sizeFormatted });
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', sizeFormatted: '0 KB' });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const rawUrl = (readerEvent.target?.result as string) || '';
          resolve({ dataUrl: rawUrl, sizeFormatted: `${(file.size / 1024).toFixed(1)} KB` });
          return;
        }

        // Draw image on canvas with high quality
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG dataUrl
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
        const sizeFormatted = `${(approxBytes / 1024).toFixed(1)} KB`;

        resolve({ dataUrl: compressedDataUrl, sizeFormatted });
      };

      img.onerror = () => {
        const rawUrl = (readerEvent.target?.result as string) || '';
        resolve({ dataUrl: rawUrl, sizeFormatted: `${(file.size / 1024).toFixed(1)} KB` });
      };

      img.src = (readerEvent.target?.result as string) || '';
    };

    reader.onerror = () => {
      resolve({ dataUrl: '', sizeFormatted: '0 KB' });
    };

    reader.readAsDataURL(file);
  });
};
