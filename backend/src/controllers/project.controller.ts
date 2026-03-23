import { Request, Response } from "express";
import { Project } from "../models/Project.model";
import { config } from "../config/env"
import cloudinary from "../config/cloudinary";
import {
  isBase64Image,
  convertBase64ToCloudinary,
} from "../utils/imageProcessor";

// Map frontend all-caps status to Mongoose enum
const statusMap: Record<string, string> = {
  "ON-SITE": "On-site",
  "DESIGN STAGE": "Design stage",
  COMPLETED: "Completed",
  UNBUILT: "Unbuilt",
};

/**
 * Helper function to generate Cloudinary folder path from project name
 */
const generateProjectFolder = (projectName: string): string => {
  return `${config.cloudinary.folderName}/${projectName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()}`;
};

/**
 * Helper function to rename a Cloudinary folder
 */
const renameCloudinaryFolder = async (
  oldFolderPath: string,
  newFolderPath: string
): Promise<boolean> => {
  try {
    // Only rename if paths are different
    if (oldFolderPath === newFolderPath) {
      return true;
    }

    console.log(`🔄 Renaming Cloudinary folder: "${oldFolderPath}" -> "${newFolderPath}"`);
    
    await cloudinary.api.rename_folder(oldFolderPath, newFolderPath);
    console.log(`✅ Cloudinary folder renamed successfully`);
    return true;
  } catch (error: any) {
    // If folder doesn't exist, it's not an error (might be first update)
    if (error.message && error.message.includes("doesn't exist")) {
      console.warn(`⚠️ Old folder doesn't exist in Cloudinary: "${oldFolderPath}". This may be normal if no assets were uploaded yet.`);
      return true;
    }
    console.error(`❌ Failed to rename Cloudinary folder:`, error);
    throw error;
  }
};

const deleteCloudinaryResourcesByPrefix = async (
  prefix: string,
  resourceType: "image" | "video" | "raw",
): Promise<void> => {
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix, {
      resource_type: resourceType,
      type: "upload",
      next_cursor: nextCursor,
      invalidate: true,
    });

    nextCursor = result.next_cursor;
  } while (nextCursor);
};

const forceDeleteCloudinaryFolder = async (folderPath: string): Promise<void> => {
  const subFolders = await cloudinary.api.sub_folders(folderPath).catch((error: any) => {
    if (error?.error?.http_code === 404 || error?.http_code === 404) {
      return { folders: [] };
    }
    throw error;
  });

  for (const subFolder of subFolders.folders || []) {
    if (subFolder?.path) {
      await forceDeleteCloudinaryFolder(subFolder.path);
    }
  }

  await deleteCloudinaryResourcesByPrefix(folderPath, "image");
  await deleteCloudinaryResourcesByPrefix(folderPath, "video");
  await deleteCloudinaryResourcesByPrefix(folderPath, "raw");

  await cloudinary.api.delete_folder(folderPath).catch((error: any) => {
    if (error?.error?.http_code === 404 || error?.http_code === 404) {
      return;
    }
    throw error;
  });
};

// ---------------- CREATE PROJECT ----------------
export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      year,
      status,
      category,
      subCategory,
      client,
      collaborators,
      projectLeaders,
      projectTeam,
      tags,
      keyDate,
      sections,
      sizeM2FT2,
      lat,
      lng,
    } = req.body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const files = req.files as any;

    // ------------------- ADDED: normalize projectLeaders and tags -------------------
    const leaders =
      typeof projectLeaders === "string"
        ? JSON.parse(projectLeaders)
        : Array.isArray(projectLeaders)
          ? projectLeaders
          : [];
    const tagList =
      typeof tags === "string"
        ? JSON.parse(tags)
        : Array.isArray(tags)
          ? tags
          : [];
    // -------------------------------------------------------------------------------

    // ------------------- ADDED: normalize project folder -------------------
    const projectFolder = generateProjectFolder(trimmedName);
    // ----------------------------------------------------------------------

    let previewImageUrl =
      files?.previewImage?.[0]?.url || req.body.previewImageUrl || "";
    let previewImagePublicId =
      files?.previewImage?.[0]?.publicId || req.body.previewImagePublicId || "";

    // Upload preview if base64
    if (previewImageUrl && isBase64Image(previewImageUrl)) {
      const result = await convertBase64ToCloudinary(
        previewImageUrl,
        projectFolder,
      );
      previewImageUrl = result.url;
      previewImagePublicId = result.publicId;
    }

    const parsedSections =
      typeof sections === "string" ? JSON.parse(sections) : sections || [];

    const updatedSections = await Promise.all(
      parsedSections.map(async (sec: any, index: number) => {
        const sectionFile = files?.sections?.[index];
        if (sectionFile) {
          return {
            type: sec.type || "image",
            content: sectionFile.url,
            publicId: sectionFile.publicId || undefined,
            order: index,
          };
        }
        if (sec.content && isBase64Image(sec.content)) {
          const result = await convertBase64ToCloudinary(
            sec.content,
            projectFolder,
          );
          return {
            type: sec.type || "image",
            content: result.url,
            publicId: result.publicId,
            order: index,
          };
        }
        return { ...sec, publicId: sec.publicId || undefined };
      }),
    );

    const count = await Project.countDocuments();

    const project = new Project({
      name: trimmedName,
      location,
      year,
      status: statusMap[status?.toUpperCase()] || status || "Design stage",
      category,
      subCategory,
      client,
      collaborators,
      projectLeaders: leaders,
      projectTeam,
      tags: tagList,
      keyDate,
      sections: updatedSections,
      previewImageUrl,
      previewImagePublicId,
      sizeM2FT2,
      order: count + 1,
      latitude: lat ? Number(lat) : undefined,
      longitude: lng ? Number(lng) : undefined,
    });

    await project.save();
    return res
      .status(201)
      .json({ message: "Project created successfully", project });
  } catch (error: any) {
    console.error("❌ Error creating project:", error);
    return res
      .status(500)
      .json({ message: "Failed to create project", error: error.message });
  }
};

// ---------------- UPDATE PROJECT ----------------
export const updateProject = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      year,
      status,
      category,
      subCategory,
      client,
      collaborators,
      projectLeaders,
      projectTeam,
      tags,
      keyDate,
      sections,
      previewImageUrl: reqPreviewImageUrl,
      previewImagePublicId: reqPreviewImagePublicId,
      sizeM2FT2,
      lat,
      lng,
    } = req.body as Record<string, any>;

    // Get existing project first to check for name changes
    const existing = await Project.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Project not found" });

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // ------------------- ADDED: Check if project name changed and rename folder -------------------
    const oldFolderPath = generateProjectFolder(existing.name);
    const newFolderPath = generateProjectFolder(trimmedName);
    
    if (existing.name !== trimmedName) {
      console.log(`📋 Project name changed: "${existing.name}" -> "${trimmedName}"`);
      try {
        await renameCloudinaryFolder(oldFolderPath, newFolderPath);
      } catch (folderRenameError: any) {
        console.error(`❌ Cloudinary folder rename failed:`, folderRenameError.message);
        return res.status(500).json({
          message: "Failed to rename project folder in Cloudinary",
          error: folderRenameError.message,
        });
      }
    }
    // -----------------------------------------------

    const files = req.files as any;

    // ------------------- ADDED: normalize projectLeaders and tags -------------------
    const leaders =
      typeof projectLeaders === "string"
        ? JSON.parse(projectLeaders)
        : Array.isArray(projectLeaders)
          ? projectLeaders
          : [];
    const tagList =
      typeof tags === "string"
        ? JSON.parse(tags)
        : Array.isArray(tags)
          ? tags
          : [];
    // -------------------------------------------------------------------------------

    let previewImageUrl =
      files?.previewImage?.[0]?.url || reqPreviewImageUrl || "";
    let previewImagePublicId =
      files?.previewImage?.[0]?.publicId || reqPreviewImagePublicId || "";

    const updateData: any = {};

    // Handle preview image if base64
    if (previewImageUrl && isBase64Image(previewImageUrl)) {
      const result = await convertBase64ToCloudinary(
        previewImageUrl,
        newFolderPath,
      );
      previewImageUrl = result.url;
      previewImagePublicId = result.publicId;
    }

    if (sizeM2FT2 !== undefined) updateData.sizeM2FT2 = sizeM2FT2;

    // Parse sections
    const parsedSections =
      typeof sections === "string"
        ? JSON.parse(sections)
        : Array.isArray(sections)
          ? sections
          : [];

    const updatedSections = await Promise.all(
      parsedSections.map(async (sec: any, index: number) => {
        const sectionFile = files?.sections?.[index];

        // New uploaded file
        if (sectionFile) {
          return {
            type: sec.type || "image",
            content: sectionFile.url,
            publicId: sectionFile.publicId || undefined,
            order: index,
          };
        }

        // Base64 content
        if (sec.content && isBase64Image(sec.content)) {
          const result = await convertBase64ToCloudinary(
            sec.content,
            newFolderPath,
          );
          return {
            type: sec.type || "image",
            content: result.url,
            publicId: result.publicId,
            order: index,
          };
        }

        if (
          sec.content &&
          !sec.publicId &&
          sec.type !== "text" &&
          sec.content.includes("res.cloudinary.com")
        ) {
          try {
            const urlParts = sec.content.split("/");
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const fileName = fileNameWithExt.split(".")[0];
            const folderPath = urlParts.slice(7, urlParts.length - 1).join("/");
            sec.publicId = `${folderPath}/${fileName}`;
          } catch (err) {
            console.warn(
              `⚠️ Failed to extract publicId from URL: ${sec.content}`,
              err,
            );
          }
        }

        return { ...sec, publicId: sec.publicId || undefined };
      }),
    );



    // Delete old preview if replaced
    if (
      previewImagePublicId &&
      existing.previewImagePublicId &&
      previewImagePublicId !== existing.previewImagePublicId
    ) {
      try {
        await cloudinary.uploader.destroy(existing.previewImagePublicId);
      } catch (e) {
        console.warn("⚠️ Failed to delete old Cloudinary preview image:", e);
      }
    }

    // Delete only sections removed from payload (safe set-diff by publicId)
    const oldSectionPublicIds = new Set(
      existing.sections
        .map((section: any) => section?.publicId)
        .filter((id: string | undefined): id is string => Boolean(id)),
    );

    const newSectionPublicIds = new Set(
      updatedSections
        .map((section: any) => section?.publicId)
        .filter((id: string | undefined): id is string => Boolean(id)),
    );

    for (const oldPublicId of oldSectionPublicIds) {
      if (!newSectionPublicIds.has(oldPublicId)) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (e) {
          console.warn(
            `⚠️ Failed to delete removed section image with publicId ${oldPublicId}:`,
            e,
          );
        }
      }
    }

    // Merge update data
    Object.assign(updateData, {
      name: trimmedName,
      location,
      year,
      status:
        statusMap[status?.toUpperCase()] ||
        status ||
        existing.status ||
        "Design stage",
      category,
      subCategory,
      client,
      collaborators,
      projectLeaders: leaders,
      projectTeam,
      tags: tagList,
      keyDate,
      sections: updatedSections,
      previewImageUrl: previewImageUrl || existing.previewImageUrl,
      previewImagePublicId:
        previewImagePublicId || existing.previewImagePublicId,
      latitude: lat ? Number(lat) : existing.latitude || null,
      longitude: lng ? Number(lng) : existing.longitude || null,
    });

    const updated = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error("❌ Error updating project:", err);
    return res
      .status(500)
      .json({ message: "Failed to update project", error: err.message });
  }
};

// ---------------- GET ALL PROJECTS ----------------
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().sort({ createdAt: 1 });

    let needsUpdate = false;

    projects.forEach((p, i) => {
      if (typeof (p as any).order !== "number") {
        (p as any).order = i + 1;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      await Promise.all(
        projects.map((p) =>
          p.save({ validateBeforeSave: false })
        )
      );
    }

    const ordered = await Project.find().sort({ order: 1 });

    const withCoords = ordered.map((p, i) => ({
      ...p.toObject(),
      latitude: p.latitude || 28.6139 + i * 0.01,
      longitude: p.longitude || 77.209 + i * 0.01,
    }));

    res.status(200).json(withCoords);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};


// ---------------- GET PROJECT BY ID ----------------
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.status(200).json(project);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to fetch project", error: err.message });
  }
};

// ---------------- DELETE PROJECT ----------------
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Generate folder path from project name instead of relying on previewImagePublicId
    const folderPrefix = generateProjectFolder(project.name);

    try {
      await forceDeleteCloudinaryFolder(folderPrefix);
      await cloudinary.api.delete_resources_by_prefix(folderPrefix)
      console.log(
        `✅ Deleted Cloudinary folder and all images: ${folderPrefix}`,
      );
    } catch (err) {
      console.warn(
        `⚠️ Failed to delete Cloudinary folder or its images: ${folderPrefix}`,
        err,
      );
    }

    await Project.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Project and its images deleted successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to delete project", error: err.message });
  }
};

// ---------------- GET MORE PROJECTS (for viewer/related section) ----------------
export const getMoreProjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 4, category } = req.query;

    // Exclude current project, optionally filter by category
    const filter: any = { _id: { $ne: id } };
    if (category) filter.category = category;

    const moreProjects = await Project.find(filter)
      .sort({ order: 1 })
      .limit(Number(limit));

    return res.status(200).json(moreProjects);
  } catch (err: any) {
    console.error("❌ Error fetching more projects:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch more projects", error: err.message });
  }
};

// ---------------- REORDER PROJECTS ----------------
export const reorderProjects = async (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body; // ["id1", "id2", "id3", ...]

    const bulk = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index + 1 },
      },
    }));

    await Project.bulkWrite(bulk);

    res.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error reordering projects:", err);
    res.status(500).json({ message: "Failed to reorder projects" });
  }
};
