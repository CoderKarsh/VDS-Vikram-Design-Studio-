import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { config } from '../config/env'
import { v2 as cloudinaryUploader } from 'cloudinary';

// Custom file interface for Cloudinary direct upload
interface CloudinaryFile extends Express.Multer.File {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
}

// Direct upload to Cloudinary without storing in memory
const cloudinaryStorage = {
  _handleFile: async (req: any, file: any, cb: any) => {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinaryUploader.uploader.upload_stream(
          {
            folder: `${config.cloudinary.folderName}`,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
            chunk_size: 6000000, // 6MB chunks
            timeout: 60000 // 60 second timeout
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        file.stream.pipe(uploadStream);
      });
      
      cb(null, {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        originalName: file.originalname,
        size: (result as any).bytes
      });
    } catch (error) {
      cb(error);
    }
  },
  
  _removeFile: (req: any, file: any, cb: any) => {
    // No cleanup needed for direct upload
    cb(null);
  }
};

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  // Allow all image types including GIFs
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  const error: any = new Error('Only image uploads are allowed (JPEG, PNG, GIF, WebP, SVG)');
  error.code = 'LIMIT_FILE_TYPE';
  return cb(error, false);
};

export const upload = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB limit
    fieldSize: 30 * 1024 * 1024, // 30MB limit for the whole field
    files: 25, // Limit number of files
    fields: 25 // Limit number of fields
  },
});
