import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/admin";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

function mediaType(mime: string): "IMAGE" | "VIDEO" | "DOCUMENT" {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "media", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isLogo = new URL(req.url).searchParams.get("logo") === "1";
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл олдсонгүй." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Файл хадгалах сан тохируулагдаагүй (BLOB_READ_WRITE_TOKEN). URL-аар нэмнэ үү." },
      { status: 501 }
    );
  }

  try {
    let body: Buffer | File = file;
    let filename = `${Date.now()}-${file.name}`;
    let contentType = file.type;
    let size = file.size;

    // Logos: auto-trim surrounding whitespace + downsize so they render crisp & small.
    if (isLogo && file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      const sharp = (await import("sharp")).default;
      const input = Buffer.from(await file.arrayBuffer());
      const processed = await sharp(input)
        .trim({ threshold: 12 })
        .resize({ height: 200, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      body = processed;
      filename = `media/logo-${Date.now()}.png`;
      contentType = "image/png";
      size = processed.length;
    } else {
      filename = `media/${filename}`;
    }

    const { put } = await import("@vercel/blob");
    const blob = await put(filename, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType,
    });
    const asset = await db.mediaAsset.create({
      data: {
        url: blob.url,
        type: mediaType(contentType),
        filename: file.name,
        mimeType: contentType,
        size,
        uploadedById: null,
      },
    });
    return NextResponse.json({ ok: true, asset });
  } catch (err) {
    console.error("[media upload]", err);
    return NextResponse.json({ error: "Байршуулалт амжилтгүй." }, { status: 500 });
  }
}
