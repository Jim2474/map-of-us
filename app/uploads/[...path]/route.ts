import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getWritableDataDir, getBundledDataDir } from "@/lib/server/dataDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

interface UploadRouteProps {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: UploadRouteProps) {
  const { path: pathSegments } = await params;

  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Prevent directory traversal attacks
  const relPath = pathSegments.join("/");
  const normalized = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, "");

  const candidateDirs = [
    path.join(getWritableDataDir(), "uploads"),
    path.join(getBundledDataDir(), "uploads"),
  ];

  let resolvedFile: string | null = null;
  let fileStat = null;

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, normalized);
    try {
      const s = await stat(candidate);
      if (s.isFile()) {
        resolvedFile = candidate;
        fileStat = s;
        break;
      }
    } catch {}
  }

  if (!resolvedFile || !fileStat) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const ext = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const etag = `W/"${fileStat.size}-${Math.floor(fileStat.mtimeMs)}"`;

  const clientEtag = request.headers.get("if-none-match");
  if (clientEtag === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  try {
    const fileBuffer = await readFile(resolvedFile);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
    });
  } catch (err) {
    console.error("Failed to read image file:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
