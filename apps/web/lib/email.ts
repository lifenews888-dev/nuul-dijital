import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM ?? "Nuul.digital <onboarding@resend.dev>";

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#0C0C1E;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <span style="font-size:28px;font-weight:700;color:#6C63FF;">nuul</span><span style="font-size:28px;font-weight:700;color:#ffffff;">.mn</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;">
          <h2 style="margin:0 0 20px;font-size:20px;color:#1a1a2e;">${title}</h2>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;text-align:center;color:#999;font-size:12px;">
          &copy; 2025 Nuul Digital LLC. Бүх эрх хуулиар хамгаалагдсан.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${url}" style="display:inline-block;background:#6C63FF;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">${text}</a>
  </td></tr></table>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body preview: ${html.slice(0, 200)}...`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuul.digital";
    const html = emailWrapper(
      "Тавтай морилно уу! 🎉",
      `<p style="color:#555;line-height:1.7;margin:0 0 16px;">Сайн байна уу, <strong>${name}</strong>!</p>
       <p style="color:#555;line-height:1.7;margin:0 0 16px;">Nuul.digital платформд бүртгүүлсэнд баярлалаа. Та одоо дараах үйлчилгээнүүдийг ашиглах боломжтой:</p>
       <ul style="color:#555;line-height:2;margin:0 0 16px;padding-left:20px;">
         <li>🌐 Домэйн нэр бүртгүүлэх</li>
         <li>🖥️ Хостинг захиалах</li>
         <li>🎨 Вэбсайт хийлгэх</li>
       </ul>
       ${button("Дашбоард руу орох", `${appUrl}/dashboard`)}
       <p style="color:#999;font-size:13px;margin:0;">Асууж тодруулах зүйл байвал бидэнтэй холбогдоорой.</p>`,
    );
    await send(email, "Nuul.digital-д тавтай морилно уу!", html);
  } catch (err) {
    console.error("[EMAIL_ERROR] sendWelcomeEmail:", err);
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  try {
    const html = emailWrapper(
      "Нууц үг сэргээх",
      `<p style="color:#555;line-height:1.7;margin:0 0 16px;">Та нууц үг сэргээх хүсэлт илгээсэн байна. Доорх товчийг дарж шинэ нууц үг тохируулна уу.</p>
       ${button("Нууц үг шинэчлэх", resetUrl)}
       <p style="color:#d9534f;font-size:13px;margin:0 0 12px;">⚠️ Энэ линк <strong>1 цагийн</strong> дотор хүчинтэй.</p>
       <p style="color:#999;font-size:13px;margin:0;">Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>`,
    );
    await send(email, "Нууц үг сэргээх", html);
  } catch (err) {
    console.error("[EMAIL_ERROR] sendPasswordResetEmail:", err);
  }
}

export async function sendPaymentConfirmation(
  email: string,
  name: string,
  amount: number,
  description: string,
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuul.digital";
    const html = emailWrapper(
      "Төлбөр амжилттай баталгаажлаа",
      `<p style="color:#555;line-height:1.7;margin:0 0 16px;">Сайн байна уу, <strong>${name}</strong>!</p>
       <p style="color:#555;line-height:1.7;margin:0 0 16px;">Таны төлбөр амжилттай хийгдлээ.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Дүн</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;font-weight:600;text-align:right;">${amount.toLocaleString()}₮</td></tr>
         <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Тайлбар</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;text-align:right;">${description}</td></tr>
       </table>
       ${button("Захиалгууд харах", `${appUrl}/dashboard/orders`)}`,
    );
    await send(email, "Төлбөр амжилттай ✅", html);
  } catch (err) {
    console.error("[EMAIL_ERROR] sendPaymentConfirmation:", err);
  }
}

export async function sendDomainOrderConfirmation(
  email: string,
  name: string,
  domain: string,
  amount: number,
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuul.digital";
    const html = emailWrapper(
      "Домэйн захиалга амжилттай",
      `<p style="color:#555;line-height:1.7;margin:0 0 16px;">Сайн байна уу, <strong>${name}</strong>!</p>
       <p style="color:#555;line-height:1.7;margin:0 0 16px;">Таны домэйн захиалга амжилттай баталгаажлаа.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Домэйн</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;font-weight:600;text-align:right;">${domain}</td></tr>
         <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Дүн</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;font-weight:600;text-align:right;">${amount.toLocaleString()}₮</td></tr>
       </table>
       ${button("Домэйн удирдах", `${appUrl}/dashboard/domains`)}`,
    );
    await send(email, "Домэйн захиалга амжилттай ✅", html);
  } catch (err) {
    console.error("[EMAIL_ERROR] sendDomainOrderConfirmation:", err);
  }
}

export async function sendHostingReady(
  email: string,
  name: string,
  serverIp: string,
  domain?: string,
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuul.digital";
    const domainRow = domain
      ? `<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Домэйн</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;text-align:right;">${domain}</td></tr>`
      : "";
    const html = emailWrapper(
      "Хостинг бэлэн боллоо! 🚀",
      `<p style="color:#555;line-height:1.7;margin:0 0 16px;">Сайн байна уу, <strong>${name}</strong>!</p>
       <p style="color:#555;line-height:1.7;margin:0 0 16px;">Таны хостинг амжилттай тохируулагдлаа. Серверийн мэдээллийг доороос харна уу.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#999;font-size:13px;">Сервер IP</td>
             <td style="padding:12px;border-bottom:1px solid #eee;color:#1a1a2e;font-weight:600;text-align:right;">${serverIp}</td></tr>
         ${domainRow}
       </table>
       ${button("Хостинг удирдах", `${appUrl}/dashboard/hosting`)}`,
    );
    await send(email, "Хостинг бэлэн боллоо!", html);
  } catch (err) {
    console.error("[EMAIL_ERROR] sendHostingReady:", err);
  }
}
