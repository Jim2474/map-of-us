import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { AppSettings, defaultAppSettings } from "@/data/appSettings";
import { getPrivateDataFilePath } from "@/lib/server/dataDir";

export const dynamic = "force-static";
export const runtime = "nodejs";

const settingsPath = getPrivateDataFilePath("appSettings.private.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function readSettingsStore(): Promise<AppSettings> {
  try {
    const file = await readFile(settingsPath, "utf8");
    const parsed = JSON.parse(file) as unknown;
    if (isRecord(parsed)) return parsed as AppSettings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error(error);
  }
  return defaultAppSettings;
}

async function writeSettingsStore(settings: AppSettings) {
  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

export async function GET() {
  const settings = await readSettingsStore();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!isRecord(payload) || !isRecord(payload.settings)) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  const existing = await readSettingsStore();
  const updated = {
    ...existing,
    ...(payload.settings as AppSettings),
  };

  await writeSettingsStore(updated);
  return NextResponse.json({ settings: updated });
}
