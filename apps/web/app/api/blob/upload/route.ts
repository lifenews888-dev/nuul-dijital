import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Client-side direct upload to Vercel Blob. Used for large files (videos)
// that exceed the ~4.5MB serverless request body limit. The browser uploads
// straight to Blob using a short-lived token generated here.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
          throw new Error("Зөвшөөрөлгүй");
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op. Could log or persist here; the client receives the URL directly.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload алдаа";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
