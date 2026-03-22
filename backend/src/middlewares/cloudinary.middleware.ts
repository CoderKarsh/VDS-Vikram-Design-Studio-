import { Request, Response, NextFunction } from "express";
import {config} from "../config/env"
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";
import crypto from "crypto";

/**
 * Upload a buffer to Cloudinary under a specified folder with a given public ID
 */
const uploadBufferToCloudinary = async (
  buffer: Buffer,
  folder: string,
  publicId: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true, // allows preview image to overwrite
        resource_type: resourceType,
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Middleware to handle Cloudinary upload for preview image and sections
 */
export const uploadToCloudinary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Use project name for folder, fallback if missing
    const projectName = (req.body.name || "UNKNOWN_PROJECT")
      .slice(0, 50)
      .replace(/\s+/g, "_")
      .toUpperCase();
    const folder = `${config.cloudinary.folderName}/${projectName}`;

    // ------------------- Preview Image -------------------
    if (req.files && (req.files as any).previewImage) {
      const file = (req.files as any).previewImage[0];
      // Fixed publicId "preview" for preview image
      const result = await uploadBufferToCloudinary(file.buffer, folder, "preview");
      req.body.previewImageUrl = result.secure_url;
      req.body.previewImagePublicId = result.public_id;
    }

    // ------------------- Section Images -------------------
    if (req.files && (req.files as any).sections) {
      const sectionFiles = (req.files as any).sections;

      req.body.sections = await Promise.all(
        sectionFiles.map(async (file: any, idx: number) => {
          // Unique hash per section
          const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
          const sectionResult = await uploadBufferToCloudinary(file.buffer, folder, hash);
          return {
            type: "image",
            content: sectionResult.secure_url,
            publicId: sectionResult.public_id,
            order: idx,
          };
        })
      );
    }

    // Trim fields for safety
    if (req.body.client) req.body.client = req.body.client.slice(0, 100);
    if (req.body.collaborators) req.body.collaborators = req.body.collaborators.slice(0, 200);
    if (req.body.name) req.body.name = req.body.name.slice(0, 255);

    next();
  } catch (err: any) {
    console.error("❌ Cloudinary upload failed:", err);

    let errorMessage = "Failed to upload image to Cloudinary";
    if (err.message.includes("File size too large")) {
      errorMessage =
        "File size too large. Please compress your GIF or use a smaller file.";
    } else if (err.message.includes("Invalid file type")) {
      errorMessage =
        "Invalid file type. Please ensure you're uploading a valid image or GIF.";
    } else if (err.message.includes("Upload preset not found")) {
      errorMessage = "Upload configuration error. Please contact support.";
    }

    return res.status(500).json({
      message: errorMessage,
      error: err.message,
    });
  }
};
