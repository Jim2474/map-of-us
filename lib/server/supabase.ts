import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getWritableDataDir } from "@/lib/server/dataDir";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "map-of-us";

export const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.MAP_OF_US_STORAGE_MODE === "supabase"
);
// 在自托管服务器（VPS）上运行时，本地文件系统持久可写
export const shouldRequirePersistentStorage = false;

export function assertWritableStorageConfigured() {
  // 自托管模式下允许直接使用本地存储
}

// 超时 fetch：Supabase 连不上时 8 秒内返回，不卡死 App
function fetchWithTimeout(url: RequestInfo | URL, init?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured) return null;
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetchWithTimeout as typeof fetch,
    },
  });
}

export async function readJsonValue<T>(key: string, fallback: T): Promise<T> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("map_of_us_store")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("[supabase] read error:", error.message);
      return fallback;
    }

    return (data?.value as T | null) ?? fallback;
  } catch (e) {
    console.error("[supabase] read failed (timeout/network):", (e as Error).message);
    return fallback;
  }
}

export async function writeJsonValue<T>(key: string, value: T): Promise<T> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return value;

  const { error } = await supabase
    .from("map_of_us_store")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw error;

  return value;
}

const dataUrlPattern = /^data:([^;]+);base64,(.+)$/;

const extensionByMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function isDataImageUrl(value: string) {
  return value.startsWith("data:image/");
}

export async function uploadDataImage(
  value: string,
  pathPrefix: string,
  fallbackFileName: string,
): Promise<string> {
  if (!isDataImageUrl(value)) return value;

  const match = dataUrlPattern.exec(value);
  if (!match) return value;

  const [, mimeType, base64] = match;
  const extension = extensionByMime.get(mimeType) ?? "jpg";
  const bytes = Buffer.from(base64, "base64");

  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const filePath = `${pathPrefix}/${fallbackFileName}.${extension}`.replaceAll(/\/+/g, "/");
        const { error } = await supabase.storage
          .from(supabaseStorageBucket)
          .upload(filePath, bytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error) {
          const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(filePath);
          return data.publicUrl;
        }
        console.warn("[supabase] storage upload failed, falling back to local disk:", error.message);
      } catch (e) {
        console.warn("[supabase] storage upload error, falling back to local disk:", (e as Error).message);
      }
    }
  }

  // Self-hosted local storage mode
  const safePrefix = pathPrefix.replace(/[^a-zA-Z0-9_\-\/]/g, "").replace(/\.\./g, "");
  const safeFileName = fallbackFileName.replace(/[^a-zA-Z0-9_\-]/g, "");
  const relPath = `${safePrefix}/${safeFileName}.${extension}`.replace(/\/+/g, "/");

  const targetPath = path.join(getWritableDataDir(), "uploads", relPath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, bytes);

  return `/uploads/${relPath}`;
}
