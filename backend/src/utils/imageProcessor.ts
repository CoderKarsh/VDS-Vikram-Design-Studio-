import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

export interface ImageUploadResult {
  url: string;
  publicId: string;
  size: number;
}

/**
 * Convert base64 image to Cloudinary URL
 * @param base64Data - Base64 encoded image data
 * @param folder - Cloudinary folder name (optional)
 * @returns Promise with Cloudinary upload result
 */
export async function convertBase64ToCloudinary(
  base64Data: string,
  folder: string = 'VDS_FOLDER'
): Promise<ImageUploadResult> {
  try {
    // Ensure Cloudinary is configured
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
      });
    }

    // Validate base64 format
    if (!base64Data.startsWith('data:image/')) {
      throw new Error('Invalid base64 image format');
    }

    // Extract image format and data
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const [, format, data] = matches;
    
    // Validate format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      throw new Error(`Unsupported image format: ${format}`);
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(data, 'base64');
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new Error(`Image too large: ${buffer.length} bytes (max: ${maxSize} bytes)`);
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/${format};base64,${data}`,
        {
          folder,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          timeout: 60000
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    };
  } catch (error) {
    console.error('Error converting base64 to Cloudinary:', error);
    throw error;
  }
}

/**
 * Validate if content is base64 image
 * @param content - Content to validate
 * @returns boolean indicating if content is base64 image
 */
export function isBase64Image(content: string): boolean {
  return typeof content === 'string' && 
         content.startsWith('data:image/') && 
         content.includes('base64,');
}

/**
 * Get base64 image size in bytes
 * @param base64Data - Base64 encoded image data
 * @returns Size in bytes
 */
export function getBase64ImageSize(base64Data: string): number {
  try {
    const matches = base64Data.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
    if (!matches) return 0;
    
    const data = matches[1];
    return Math.floor((data.length * 3) / 4); // Approximate size
  } catch {
    return 0;
  }
}

/**
 * Clean up base64 data from project sections
 * @param sections - Project sections array
 * @returns Cleaned sections array
 */
export function cleanBase64FromSections(sections: any[]): any[] {
  return sections.map(section => {
    if (section.type === 'image' && isBase64Image(section.content)) {
      return {
        ...section,
        content: '', // Remove base64 content
        _needsUpload: true // Flag for processing
      };
    }
    return section;
  });
}
