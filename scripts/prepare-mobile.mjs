import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const androidAssetsDir = path.join(root, "android", "app", "src", "main", "assets", "public");

async function copyIfPresent(from, to) {
  try {
    await cp(from, to, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") console.error(error);
  }
}

async function prepareMobileData() {
  await mkdir(androidAssetsDir, { recursive: true });

  // Copy public assets & static standalone app assets
  await copyIfPresent(path.join(root, "public"), androidAssetsDir);
  if (path.join(root, "out")) {
    await copyIfPresent(path.join(root, "out"), androidAssetsDir);
  }

  // Read private user data files
  const readJson = async (fileName) => {
    try {
      const content = await readFile(path.join(root, "data", fileName), "utf8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  };

  const memories = await readJson("localMemories.private.json");
  const spots = await readJson("localSpots.private.json");
  const settings = await readJson("appSettings.private.json");

  // Write embedded mobile bootstrap data file into assets
  const mobileData = { memories, spots, settings };
  await writeFile(
    path.join(androidAssetsDir, "mobile-data.json"),
    JSON.stringify(mobileData, null, 2),
    "utf8"
  );

  console.log("[mobile] Android mobile assets and private user data prepared successfully!");
}

prepareMobileData().catch(console.error);
