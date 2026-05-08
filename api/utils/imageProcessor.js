import path from 'path';

/**
 * Converts an image buffer to WebP format using sharp if available,
 * otherwise falls back to uploading the original image.
 * This ensures compatibility with Vercel's serverless environment.
 */
export const convertToWebP = async (buffer) => {
  try {
    // Dynamically import sharp — it may not be available in all environments
    const sharp = (await import('sharp')).default;
    return await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    // If sharp fails (e.g., on Vercel serverless), just return the original buffer
    console.warn('⚠️ sharp not available, uploading original image format instead.');
    return buffer;
  }
};

/**
 * Generates a clean filename. Uses .webp extension when sharp is available,
 * otherwise keeps the original extension.
 * @param {string} originalName - The original filename.
 * @param {boolean} asWebP - Whether to use .webp extension.
 * @returns {string} - The new filename.
 */
export const getWebPFilename = (originalName, asWebP = true) => {
  const parsed = path.parse(originalName);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = asWebP ? '.webp' : parsed.ext;
  return `${parsed.name}-${uniqueSuffix}${ext}`;
};
