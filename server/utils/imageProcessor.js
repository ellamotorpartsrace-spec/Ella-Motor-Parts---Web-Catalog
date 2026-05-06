import sharp from 'sharp';
import path from 'path';

/**
 * Converts an image buffer to WebP format and optimizes it.
 * @param {Buffer} buffer - The image buffer to process.
 * @returns {Promise<Buffer>} - The processed WebP image buffer.
 */
export const convertToWebP = async (buffer) => {
  try {
    return await sharp(buffer)
      .webp({ quality: 80 }) // Adjust quality as needed
      .toBuffer();
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw error;
  }
};

/**
 * Generates a clean filename with .webp extension.
 * @param {string} originalName - The original filename.
 * @returns {string} - The new filename with .webp extension.
 */
export const getWebPFilename = (originalName) => {
  const name = path.parse(originalName).name;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `${name}-${uniqueSuffix}.webp`;
};
