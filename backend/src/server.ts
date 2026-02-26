import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import connectDB from "./config/db";
import { config } from "./config/env";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import contactRoutes from "./routes/contact.routes";
import adminRoutes from "./routes/admin.routes";
import aboutRoutes from "./routes/about.routes";
import contactContentRoutes from "./routes/contactContent.routes";
import rolesRoute from "./routes/roles.routes";
import teamRoutes from "./routes/team.routes";
import applicationsRoute from "./routes/applications.routes";
import tagRoutes from "./routes/tag.routes";

import { errorHandler } from "./middlewares/error.middleware";
import { generalRateLimit } from "./middlewares/rateLimit.middleware";

// =============================
// CONNECT DATABASE
// =============================

connectDB();

const app: Express = express();
const PORT = config.port;

// =============================
// CORS CONFIG
// =============================

const allowedOrigins = [
  "https://vikramdesignstudio.com",
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN || "",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`❌ CORS blocked for origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// =============================
// BODY PARSING
// =============================

app.use(
  express.json({
    limit: "30mb",
    verify: (req, res, buf) => {
      if (buf.length > 15 * 1024 * 1024) {
        console.warn("⚠️ Large request detected:", buf.length, "bytes");
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "30mb",
  })
);

// =============================
// RATE LIMIT
// =============================

app.use(generalRateLimit);

// =============================
// UPLOADS STATIC DIRECTORY
// =============================

const uploadRoot = process.env.UPLOAD_DIR || "uploads";
const uploadsPath = path.join(process.cwd(), uploadRoot);

fs.mkdirSync(uploadsPath, { recursive: true });

app.use("/uploads", express.static(uploadsPath));

// =============================
// HEALTH CHECK
// =============================

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "VDS Backend API is running...",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// =============================
// API ROUTES
// =============================

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/content", contactContentRoutes);
app.use("/api/content", teamRoutes);
app.use("/api/roles", rolesRoute);
app.use("/api/applications", applicationsRoute);

// =============================
// ERROR HANDLING
// =============================

app.use(errorHandler);

app.use("*", (_req: Request, res: Response) =>
  res.status(404).json({ message: "Route not found" })
);

// =============================
// MEMORY MONITORING
// =============================

const logMemoryUsage = () => {
  const used = process.memoryUsage();

  console.log("Memory Usage:", {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`,
  });
};

// Every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);

// Optional manual GC (run node with --expose-gc)
if (global.gc) {
  setInterval(() => {
    global.gc!();
    console.log("🧹 Garbage collection triggered");
  }, 10 * 60 * 1000);
}

// =============================
// START SERVER
// =============================

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsPath}`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  logMemoryUsage();
});

// Increase server timeouts to accommodate larger file uploads and slow networks.
// Default Node server timeout may close long-running requests; bump to 5 minutes.
server.setTimeout(5 * 60 * 1000); // 5 minutes for socket inactivity

// Increase headersTimeout so slow clients uploading large multipart bodies don't get cut off.
// Headers timeout must be larger than server.timeout in some Node versions; add small buffer.
if ((server as any).headersTimeout !== undefined) {
  try {
    (server as any).headersTimeout = 5 * 60 * 1000 + 10000; // 5m + 10s
  } catch (e) {
    // ignore if not supported
  }
}

// KeepAlive timeout (milliseconds) — allow connections to remain for short periods.
if ((server as any).keepAliveTimeout === undefined) {
  // no-op
} else {
  try {
    (server as any).keepAliveTimeout = 60 * 1000; // 60s
  } catch (e) {}
}
