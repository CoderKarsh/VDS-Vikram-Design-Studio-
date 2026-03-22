import { Request, Response } from "express";
import TeamPage from "../models/TeamPage.model";
import {
  isBase64Image,
  convertBase64ToCloudinary,
} from "../utils/imageProcessor";
import { config } from "../config/env";

export const getTeamPage = async (req: Request, res: Response) => {
  try {
    let page = await TeamPage.findOne({ page: "TEAM" });
    if (!page) {
      page = await TeamPage.create({
        page: "TEAM",
        heading: { title: "", subtitle: "", image: "", paragraphs: [] },
        members: [],
        marquee_images: [],
      });
    }

    res.json({
      heading: page.heading || { paragraphs: [] },
      members: (page.members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        position: m.position,
        photo: m.photo,
        featured: !!m.featured,
        description: m.description || "",
      })),
      marquee_images: page.marquee_images || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Team page" });
  }
};

export const updateHeading = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    if (content?.image && isBase64Image(content.image)) {
      const folderBase =
        config.cloudinary.folderName;
      const result = await convertBase64ToCloudinary(
        content.image,
        `${folderBase}/TEAM/HEADING`
      );
      content.image = result.url;
    }

    const page = await TeamPage.findOneAndUpdate(
      { page: "TEAM" },
      { heading: content, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(page?.heading);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update heading" });
  }
};

export const updateMembers = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    if (!Array.isArray(content))
      return res.status(400).json({ error: "Members must be an array" });

    for (const member of content) {
      if (member.photo && isBase64Image(member.photo)) {
        const folderBase =
          config.cloudinary.folderName;
        const result = await convertBase64ToCloudinary(
          member.photo,
          `${folderBase}/TEAM/MEMBERS`
        );
        member.photo = result.url;
      }
      // Ensure description field exists so older records and clients remain consistent
      if (typeof member.description === "undefined") member.description = "";
    }

    const page = await TeamPage.findOneAndUpdate(
      { page: "TEAM" },
      { members: content, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(page?.members || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update members" });
  }
};

export const updateMarquee = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    if (!Array.isArray(content))
      return res.status(400).json({ error: "Marquee images must be an array" });

    for (const img of content) {
      if (img.img_src && isBase64Image(img.img_src)) {
        const folderBase =
          config.cloudinary.folderName;
        const result = await convertBase64ToCloudinary(
          img.img_src,
          `${folderBase}/TEAM/MARQUEE`
        );
        img.img_src = result.url;
      }
    }

    const page = await TeamPage.findOneAndUpdate(
      { page: "TEAM" },
      { marquee_images: content, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(page?.marquee_images || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marquee images" });
  }
};
