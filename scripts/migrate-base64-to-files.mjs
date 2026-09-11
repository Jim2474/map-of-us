import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const uploadsDir = path.join(dataDir, "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function saveBase64(base64Data, targetDir, baseFileName) {
  if (typeof base64Data !== "string" || !base64Data.startsWith("data:image/")) {
    return null;
  }

  const match = /^data:([^;]+);base64,(.+)$/.exec(base64Data);
  if (!match) return null;

  const [, mime, b64] = match;
  const ext = EXT_BY_MIME[mime] || "jpg";
  const fileName = `${baseFileName}.${ext}`;
  const filePath = path.join(targetDir, fileName);

  ensureDir(targetDir);
  fs.writeFileSync(filePath, Buffer.from(b64, "base64"));

  const rel = path.relative(uploadsDir, filePath).replace(/\\/g, "/");
  return `/uploads/${rel}`;
}

// 1. localMemories.private.json
const memoriesFile = path.join(dataDir, "localMemories.private.json");
if (fs.existsSync(memoriesFile)) {
  console.log(`[migrate] Processing ${memoriesFile}...`);
  const raw = fs.readFileSync(memoriesFile, "utf8");
  fs.writeFileSync(`${memoriesFile}.bak`, raw);
  const data = JSON.parse(raw);

  let convertedCount = 0;
  for (const [cityId, memories] of Object.entries(data)) {
    if (!Array.isArray(memories)) continue;
    for (const mem of memories) {
      const safeMemId = String(mem.id).replace(/[^a-zA-Z0-9_\-]/g, "_");
      const memDir = path.join(uploadsDir, "memories", cityId, safeMemId);

      if (mem.image && mem.image.startsWith("data:image/")) {
        const url = saveBase64(mem.image, memDir, "cover");
        if (url) {
          mem.image = url;
          convertedCount++;
        }
      }

      if (Array.isArray(mem.photos)) {
        mem.photos = mem.photos.map((photo, idx) => {
          if (typeof photo === "string" && photo.startsWith("data:image/")) {
            const url = saveBase64(photo, memDir, `photo-${idx + 1}`);
            if (url) {
              convertedCount++;
              return url;
            }
          }
          return photo;
        });
      }
    }
  }

  fs.writeFileSync(memoriesFile, JSON.stringify(data, null, 2) + "\n", "utf8");
  const newSize = fs.statSync(memoriesFile).size;
  console.log(`[migrate] Converted ${convertedCount} memory images. New size: ${(newSize / 1024).toFixed(2)} KB`);
}

// 2. loginPhotos.private.json
const loginFile = path.join(dataDir, "loginPhotos.private.json");
if (fs.existsSync(loginFile)) {
  console.log(`[migrate] Processing ${loginFile}...`);
  const raw = fs.readFileSync(loginFile, "utf8");
  fs.writeFileSync(`${loginFile}.bak`, raw);
  const data = JSON.parse(raw);

  let convertedCount = 0;
  if (data.photos && typeof data.photos === "object") {
    for (const [slotId, photo] of Object.entries(data.photos)) {
      if (typeof photo === "string" && photo.startsWith("data:image/")) {
        const slotDir = path.join(uploadsDir, "login-photos", slotId);
        const url = saveBase64(photo, slotDir, "cover");
        if (url) {
          data.photos[slotId] = url;
          convertedCount++;
        }
      }
    }
  }

  fs.writeFileSync(loginFile, JSON.stringify(data, null, 2) + "\n", "utf8");
  const newSize = fs.statSync(loginFile).size;
  console.log(`[migrate] Converted ${convertedCount} login photos. New size: ${(newSize / 1024).toFixed(2)} KB`);
}

// 3. cityAssets.private.json
const cityAssetsFile = path.join(dataDir, "cityAssets.private.json");
if (fs.existsSync(cityAssetsFile)) {
  console.log(`[migrate] Processing ${cityAssetsFile}...`);
  const raw = fs.readFileSync(cityAssetsFile, "utf8");
  fs.writeFileSync(`${cityAssetsFile}.bak`, raw);
  const data = JSON.parse(raw);

  let convertedCount = 0;
  for (const [cityId, asset] of Object.entries(data)) {
    if (typeof asset === "string" && asset.startsWith("data:image/")) {
      const assetDir = path.join(uploadsDir, "city-assets", cityId);
      const url = saveBase64(asset, assetDir, "landmark");
      if (url) {
        data[cityId] = url;
        convertedCount++;
      }
    }
  }

  fs.writeFileSync(cityAssetsFile, JSON.stringify(data, null, 2) + "\n", "utf8");
  const newSize = fs.statSync(cityAssetsFile).size;
  console.log(`[migrate] Converted ${convertedCount} city assets. New size: ${(newSize / 1024).toFixed(2)} KB`);
}

console.log("[migrate] Migration completed successfully!");
