import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // Accept common image and video types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/webm",
  ];

  console.log("[MULTER] File received:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  console.error(
    `[MULTER] Invalid file type rejected: ${file.mimetype} for file ${file.originalname}`,
  );
  cb(
    new Error(
      `Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, WebP, GIF, BMP) and videos (MP4, WebM) are allowed`,
    ),
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
