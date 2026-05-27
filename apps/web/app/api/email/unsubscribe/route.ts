import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/email-marketing";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      buildHtmlPage("Алдаа", "Токен олдсонгүй"),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    await unsubscribeByToken(token);

    return new NextResponse(
      buildHtmlPage(
        "Амжилттай",
        "Та амжилттай захиалга цуцлалаа"
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    return new NextResponse(
      buildHtmlPage("Алдаа", "Захиалга цуцлахад алдаа гарлаа"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function buildHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Nuul.digital</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1e293b;
    }
    .container {
      text-align: center;
      background: white;
      padding: 48px 40px;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      max-width: 440px;
      width: 90%;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 24px;
    }
    .message {
      font-size: 18px;
      line-height: 1.6;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Nuul.digital</div>
    <p class="message">${message}</p>
  </div>
</body>
</html>`;
}
