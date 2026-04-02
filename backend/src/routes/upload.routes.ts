import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../config/multer.config";

const router = Router();

// Single image upload endpoint (for profile pictures, etc.)
router.post(
  "/upload",
  authorizedMiddleware,
  upload.single("image"),
  (req, res) => {
    console.log("[UPLOAD] Received single image upload request");
    console.log("[UPLOAD] File:", req.file);

    if (!req.file) {
      console.log("[UPLOAD] No file uploaded");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const uploaded = {
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
    };

    console.log(
      "[UPLOAD] Single image uploaded successfully:",
      uploaded.filename,
    );
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      path: uploaded.path,
      files: [uploaded],
    });
  },
);

// Multiple files upload endpoint (for gallery, etc.)
router.post(
  "/upload-files",
  authorizedMiddleware,
  upload.array("files", 10),
  (req, res) => {
    console.log("[UPLOAD] Received multiple files upload request");
    console.log("[UPLOAD] Files:", req.files);

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      console.log("[UPLOAD] No files uploaded");
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const uploaded = files.map((file: any) => ({
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
    }));

    console.log(
      "[UPLOAD] Multiple files uploaded successfully:",
      uploaded.map((f) => f.filename),
    );
    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploaded,
    });
  },
);

// Error handler for multer errors
router.use((err: any, req: any, res: any, next: any) => {
  console.error("[UPLOAD ERROR]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds 10MB limit",
    });
  }
  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: "Only images and MP4/WebM videos are allowed",
    });
  }
  res.status(500).json({
    success: false,
    message: err.message || "Upload failed",
  });
});

export default router;
