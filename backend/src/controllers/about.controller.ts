import { Request, Response } from "express";
import AboutPage from "../models/AboutPage.model";
import {
  isBase64Image,
  convertBase64ToCloudinary,
} from "../utils/imageProcessor";
import { normalizeSections } from "../utils/normalizeAbout";
import { config } from "../config/env";

/* ---------- TYPES ---------- */
type AboutParagraph = {
  id: number;
  text: string;
};

type AboutCarouselCard = {
  id: number;
  img_src?: string;
  text?: string;
  project_name?: string;
  project_location?: string;
};

type AboutSection = {
  heading: string;
  paragraphs: AboutParagraph[];
  carousel_cards: AboutCarouselCard[];
};

/* ---------- GET ABOUT PAGE ---------- */
export const getAboutPage = async (_: Request, res: Response) => {
  try {
    let about = await AboutPage.findOne({ page: "ABOUT" });

    if (!about) {
      about = await AboutPage.create({ page: "ABOUT" });
    }

    res.json({
      hero: about.hero || {},
      metrics: about.metrics || [],
      sections: about.sections || {},
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch About page" });
  }
};

/* ---------- UPDATE HERO ---------- */
export const updateHero = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    const hero = {
      title: content.title,
      subtitle: content.subtitle,
      subtitleLine2: content.subtitleLine2 || "",
      image: content.image,
      paragraphs: content.paragraphs || [],
    };

    if (hero.image && isBase64Image(hero.image)) {
      const result = await convertBase64ToCloudinary(
        hero.image,
        `${config.cloudinary.folderName}/ABOUT/HERO`
      );
      hero.image = result.url;
    }

    const about = await AboutPage.findOneAndUpdate(
      { page: "ABOUT" },
      { hero, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(about?.hero);
  } catch (err) {
    console.error("❌ Hero update failed:", err);
    res.status(500).json({ error: "Failed to update hero" });
  }
};

/* ---------- UPDATE METRICS ---------- */
export const updateMetrics = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    const about = await AboutPage.findOneAndUpdate(
      { page: "ABOUT" },
      { metrics: content, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(about?.metrics);
  } catch (err) {
    console.error("❌ Metrics update failed:", err);
    res.status(500).json({ error: "Failed to update metrics" });
  }
};

/* ---------- UPDATE SECTIONS (FIXED) ---------- */
export const updateSections = async (req: Request, res: Response) => {
  try {
    const { content, lastModifiedBy } = req.body;

    const normalized = normalizeSections(content) as Record<
      string,
      AboutSection
    >;

    for (const section of Object.values(normalized)) {
      if (!Array.isArray(section.carousel_cards)) continue;

      // 📁 Folder = section heading (architecture, landscape, etc.)
      const folderName = section.heading
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const folder = `${config.cloudinary.folderName}/ABOUT/SECTIONS/${folderName}`;

      for (const card of section.carousel_cards) {
        // ✅ Upload ONLY base64 images
        if (card.img_src && isBase64Image(card.img_src)) {
          const result = await convertBase64ToCloudinary(
            card.img_src,
            folder
          );

          // 🔁 Replace base64 with URL (prevents re-upload)
          card.img_src = result.url;
        }
      }
    }

    const about = await AboutPage.findOneAndUpdate(
      { page: "ABOUT" },
      { sections: normalized, lastModifiedBy },
      { new: true, upsert: true }
    );

    res.json(about?.sections);
  } catch (err) {
    console.error("❌ Sections update failed:", err);
    res.status(500).json({ error: "Failed to update sections" });
  }
};
