import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");

async function copyIfPresent(from, to) {
  try {
    await cp(from, to, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await mkdir(standaloneNextDir, { recursive: true });
await copyIfPresent(path.join(root, "public"), path.join(standaloneDir, "public"));
await copyIfPresent(path.join(root, ".next", "static"), path.join(standaloneNextDir, "static"));
await copyIfPresent(path.join(root, ".env.local"), path.join(standaloneDir, ".env.local"));
await mkdir(path.join(standaloneDir, "data"), { recursive: true });
const dataFiles = [
  "localMemories.private.json",
  "localSpots.private.json",
  "appSettings.private.json",
  "localMemories.json",
  "localSpots.json",
  "cityAssets.private.json",
  "loginPhotos.private.json",
  "deletedRecords.private.json",
];
for (const fileName of dataFiles) {
  await copyIfPresent(path.join(root, "data", fileName), path.join(standaloneDir, "data", fileName));
}
await copyIfPresent(path.join(root, "data", "uploads"), path.join(standaloneDir, "data", "uploads"));
await copyIfPresent(path.join(root, "data", "uploads"), path.join(standaloneDir, "public", "uploads"));

console.log("[desktop] standalone assets and user data prepared");
