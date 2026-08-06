import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const androidAssetsDir = path.join(root, "android", "app", "src", "main", "assets", "public");

async function prepareMobileData() {
  await mkdir(androidAssetsDir, { recursive: true });

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
