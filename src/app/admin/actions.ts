"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SETTINGS_TAG } from "@/lib/settings";
import { CONTENT_TAG } from "@/lib/content";
import {
  requirePermission,
  str,
  optStr,
  bool,
  num,
  lines,
  json,
  statusFields,
  seoFields,
} from "@/lib/admin";
import { assertCan } from "@/lib/rbac";
import { snapshotRevision, type RevisionEntity } from "@/lib/revisions";
import { logActivity } from "@/lib/activity";

type Results = { label: string; value: string }[];
type Quote = { quote: string; author: string; role: string } | undefined;

// ---------------- Pages ----------------

export async function savePage(formData: FormData) {
  const user = await requirePermission("content", "update");
  const sf = statusFields(formData);
  if (sf.status === "PUBLISHED") assertCan(user.role, "content", "publish");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    content: str(formData, "content"),
    ...sf,
    ...seoFields(formData),
  };
  const saved = id
    ? await db.page.update({ where: { id }, data })
    : await db.page.create({ data });
  await snapshotRevision("Page", saved.id, data);
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Page",
    entityId: saved.id,
    summary: `${id ? "Засварласан" : "Үүсгэсэн"} хуудас: ${data.title}`,
  });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.page.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Page", entityId: id, summary: "Хуудас устгасан" });
  revalidatePath("/admin/pages");
}

// ---------------- Posts (Articles) ----------------

export async function savePost(formData: FormData) {
  const user = await requirePermission("content", "update");
  const sf = statusFields(formData);
  if (sf.status === "PUBLISHED") assertCan(user.role, "content", "publish");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    excerpt: str(formData, "excerpt"),
    content: str(formData, "content"),
    category: str(formData, "category"),
    cover: str(formData, "cover"),
    tags: lines(formData, "tags"),
    featured: bool(formData, "featured"),
    ...sf,
    ...seoFields(formData),
  };
  const saved = id
    ? await db.post.update({ where: { id }, data })
    : await db.post.create({ data });
  await snapshotRevision("Post", saved.id, data);
  await logActivity({
    action: sf.status === "PUBLISHED" ? "PUBLISH" : id ? "UPDATE" : "CREATE",
    entity: "Post",
    entityId: saved.id,
    summary: `${id ? "Засварласан" : "Үүсгэсэн"} нийтлэл: ${data.title}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePost(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.post.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Post", entityId: id, summary: "Нийтлэл устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/posts");
}

// ---------------- Projects ----------------

export async function saveProject(formData: FormData) {
  const user = await requirePermission("content", "update");
  const sf = statusFields(formData);
  if (sf.status === "PUBLISHED") assertCan(user.role, "content", "publish");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    industry: str(formData, "industry"),
    description: str(formData, "description"),
    technologies: lines(formData, "technologies"),
    results: json<Results>(formData, "results", []),
    image: str(formData, "image"),
    gallery: lines(formData, "gallery"),
    link: optStr(formData, "link"),
    year: str(formData, "year"),
    services: lines(formData, "services"),
    featured: bool(formData, "featured"),
    ...sf,
    ...seoFields(formData),
  };
  const saved = id
    ? await db.project.update({ where: { id }, data })
    : await db.project.create({ data });
  await snapshotRevision("Project", saved.id, data);
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Project",
    entityId: saved.id,
    summary: `${id ? "Засварласан" : "Үүсгэсэн"} төсөл: ${data.name}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.project.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Project", entityId: id, summary: "Төсөл устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/projects");
}

/**
 * Imports projects from the connected Vercel account as DRAFT portfolio items
 * (name + live link + auto screenshot). Existing slugs are skipped, so it's
 * safe to re-run as new projects are deployed. Admins then enrich and publish.
 */
export async function importFromVercel() {
  await requirePermission("content", "create");
  const { listVercelProjects } = await import("@/lib/vercel");
  const projects = await listVercelProjects();
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const shot = (url: string) =>
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
  const year = String(new Date().getFullYear());

  let created = 0;
  for (const p of projects) {
    if (!p.link || !p.name) continue;
    const slug = slugify(p.name);
    if (!slug) continue;
    const existing = await db.project.findUnique({ where: { slug } });
    if (existing) continue;
    await db.project.create({
      data: {
        slug,
        name: p.name,
        industry: "—",
        description: "Vercel-ээс импортолсон төсөл. Тайлбар, салбар, үр дүнг нэмнэ үү.",
        technologies: [],
        results: [],
        image: shot(p.link),
        gallery: [],
        link: p.link,
        year,
        services: [],
        featured: false,
        status: "DRAFT",
      },
    });
    created++;
  }

  await logActivity({ action: "CREATE", entity: "Project", summary: `Vercel-ээс ${created} төсөл импортолсон` });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/projects");
}

// ---------------- Case Studies ----------------

export async function saveCaseStudy(formData: FormData) {
  const user = await requirePermission("content", "update");
  const sf = statusFields(formData);
  if (sf.status === "PUBLISHED") assertCan(user.role, "content", "publish");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    client: str(formData, "client"),
    industry: str(formData, "industry"),
    excerpt: str(formData, "excerpt"),
    cover: str(formData, "cover"),
    duration: str(formData, "duration"),
    services: lines(formData, "services"),
    challenge: str(formData, "challenge"),
    approach: lines(formData, "approach"),
    solution: str(formData, "solution"),
    results: json<Results>(formData, "results", []),
    testimonial: json<Quote>(formData, "testimonial", undefined),
    featured: bool(formData, "featured"),
    ...sf,
    ...seoFields(formData),
  };
  const saved = id
    ? await db.caseStudy.update({ where: { id }, data })
    : await db.caseStudy.create({ data });
  await snapshotRevision("CaseStudy", saved.id, data);
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "CaseStudy",
    entityId: saved.id,
    summary: `${id ? "Засварласан" : "Үүсгэсэн"} кейс: ${data.title}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/case-studies");
  redirect("/admin/case-studies");
}

export async function deleteCaseStudy(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.caseStudy.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "CaseStudy", entityId: id, summary: "Кейс устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/case-studies");
}

// ---------------- Testimonials ----------------

export async function saveTestimonial(formData: FormData) {
  await requirePermission("testimonials", "update");
  const id = optStr(formData, "id");
  const data = {
    quote: str(formData, "quote"),
    author: str(formData, "author"),
    role: str(formData, "role"),
    company: str(formData, "company"),
    rating: num(formData, "rating", 5),
    avatar: str(formData, "avatar"),
    order: num(formData, "order", 0),
    published: bool(formData, "published"),
  };
  const saved = id
    ? await db.testimonial.update({ where: { id }, data })
    : await db.testimonial.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Testimonial",
    entityId: saved.id,
    summary: `Сэтгэгдэл: ${data.author}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  await requirePermission("testimonials", "delete");
  const id = str(formData, "id");
  await db.testimonial.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Testimonial", entityId: id, summary: "Сэтгэгдэл устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/testimonials");
}

// ---------------- Team Members ----------------

export async function saveTeamMember(formData: FormData) {
  await requirePermission("team", "update");
  const id = optStr(formData, "id");
  const data = {
    name: str(formData, "name"),
    role: str(formData, "role"),
    bio: optStr(formData, "bio"),
    avatar: str(formData, "avatar"),
    socials: json<Record<string, string> | undefined>(formData, "socials", undefined),
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id
    ? await db.teamMember.update({ where: { id }, data })
    : await db.teamMember.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "TeamMember",
    entityId: saved.id,
    summary: `Багийн гишүүн: ${data.name}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/team");
  redirect("/admin/team");
}

export async function deleteTeamMember(formData: FormData) {
  await requirePermission("team", "delete");
  const id = str(formData, "id");
  await db.teamMember.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "TeamMember", entityId: id, summary: "Гишүүн устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/team");
}

// ---------------- FAQs ----------------

export async function saveFaq(formData: FormData) {
  await requirePermission("faqs", "update");
  const id = optStr(formData, "id");
  const data = {
    question: str(formData, "question"),
    answer: str(formData, "answer"),
    category: str(formData, "category") || "Ерөнхий",
    order: num(formData, "order", 0),
    published: bool(formData, "published"),
  };
  const saved = id ? await db.faq.update({ where: { id }, data }) : await db.faq.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Faq",
    entityId: saved.id,
    summary: `FAQ: ${data.question}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function deleteFaq(formData: FormData) {
  await requirePermission("faqs", "delete");
  const id = str(formData, "id");
  await db.faq.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Faq", entityId: id, summary: "FAQ устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/faqs");
}

// ---------------- Homepage: Stats / Values / Process ----------------

export async function saveStat(formData: FormData) {
  await requirePermission("site", "update");
  const id = optStr(formData, "id");
  const data = {
    value: num(formData, "value", 0),
    suffix: str(formData, "suffix"),
    label: str(formData, "label"),
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id ? await db.stat.update({ where: { id }, data }) : await db.stat.create({ data });
  await logActivity({ action: id ? "UPDATE" : "CREATE", entity: "Stat", entityId: saved.id, summary: `Статистик: ${data.label}` });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/stats");
  redirect("/admin/stats");
}

export async function deleteStat(formData: FormData) {
  await requirePermission("site", "delete");
  const id = str(formData, "id");
  await db.stat.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Stat", entityId: id, summary: "Статистик устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/stats");
}

export async function saveValue(formData: FormData) {
  await requirePermission("site", "update");
  const id = optStr(formData, "id");
  const data = {
    title: str(formData, "title"),
    description: str(formData, "description"),
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id ? await db.value.update({ where: { id }, data }) : await db.value.create({ data });
  await logActivity({ action: id ? "UPDATE" : "CREATE", entity: "Value", entityId: saved.id, summary: `Үнэт зүйл: ${data.title}` });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/values");
  redirect("/admin/values");
}

export async function deleteValue(formData: FormData) {
  await requirePermission("site", "delete");
  const id = str(formData, "id");
  await db.value.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Value", entityId: id, summary: "Үнэт зүйл устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/values");
}

export async function saveProcessStep(formData: FormData) {
  await requirePermission("site", "update");
  const id = optStr(formData, "id");
  const data = {
    step: str(formData, "step"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    icon: str(formData, "icon") || "Sparkles",
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id ? await db.processStep.update({ where: { id }, data }) : await db.processStep.create({ data });
  await logActivity({ action: id ? "UPDATE" : "CREATE", entity: "ProcessStep", entityId: saved.id, summary: `Алхам: ${data.title}` });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/process");
  redirect("/admin/process");
}

export async function deleteProcessStep(formData: FormData) {
  await requirePermission("site", "delete");
  const id = str(formData, "id");
  await db.processStep.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "ProcessStep", entityId: id, summary: "Алхам устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/process");
}

// ---------------- Jobs (Careers) ----------------

export async function saveJob(formData: FormData) {
  await requirePermission("jobs", "update");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    department: str(formData, "department"),
    location: str(formData, "location"),
    type: str(formData, "type"),
    level: str(formData, "level"),
    summary: str(formData, "summary"),
    responsibilities: lines(formData, "responsibilities"),
    requirements: lines(formData, "requirements"),
    active: bool(formData, "active"),
  };
  const saved = id ? await db.job.update({ where: { id }, data }) : await db.job.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Job",
    entityId: saved.id,
    summary: `Ажлын байр: ${data.title}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/careers");
  redirect("/admin/careers");
}

export async function deleteJob(formData: FormData) {
  await requirePermission("jobs", "delete");
  const id = str(formData, "id");
  await db.job.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Job", entityId: id, summary: "Ажлын байр устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/careers");
}

// ---------------- Media ----------------

export async function registerMedia(formData: FormData) {
  await requirePermission("media", "create");
  const url = str(formData, "url");
  const data = {
    url,
    type: (str(formData, "type") || "IMAGE") as "IMAGE" | "VIDEO" | "DOCUMENT",
    filename: str(formData, "filename") || url.split("/").pop() || "asset",
    alt: optStr(formData, "alt"),
  };
  const saved = await db.mediaAsset.create({ data });
  await logActivity({ action: "CREATE", entity: "Media", entityId: saved.id, summary: `Медиа: ${data.filename}` });
  revalidatePath("/admin/media");
}

export async function deleteMedia(formData: FormData) {
  await requirePermission("media", "delete");
  const id = str(formData, "id");
  await db.mediaAsset.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Media", entityId: id, summary: "Медиа устгасан" });
  revalidatePath("/admin/media");
}

// ---------------- Version history: restore ----------------

const MODEL_BY_ENTITY = {
  Post: () => db.post,
  Project: () => db.project,
  CaseStudy: () => db.caseStudy,
  Page: () => db.page,
} as const;

export async function restoreRevision(formData: FormData) {
  await requirePermission("content", "update");
  const revisionId = str(formData, "revisionId");
  const rev = await db.contentRevision.findUnique({ where: { id: revisionId } });
  if (!rev) return;
  const entity = rev.entity as RevisionEntity;
  const model = MODEL_BY_ENTITY[entity];
  if (!model) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (model() as any).update({ where: { id: rev.entityId }, data: rev.data });
  } catch (err) {
    // Schema drift since the snapshot, or a unique-constraint collision (e.g. slug)
    // would otherwise crash the action — degrade gracefully instead.
    console.error("[restoreRevision]", err);
    return;
  }
  await snapshotRevision(entity, rev.entityId, rev.data as Record<string, unknown>);
  await logActivity({
    action: "RESTORE",
    entity,
    entityId: rev.entityId,
    summary: `${entity} #${rev.version} хувилбар сэргээсэн`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath(`/admin/${entity.toLowerCase()}`);
}

// ---------------- Leads / Contacts / Meetings ----------------

export async function setLeadStatus(formData: FormData) {
  await requirePermission("leads", "update");
  const id = str(formData, "id");
  const status = str(formData, "status");
  await db.lead.update({ where: { id }, data: { status: status as never } });
  await logActivity({ action: "UPDATE", entity: "Lead", entityId: id, summary: `Лид төлөв: ${status}` });
  revalidatePath("/admin/leads");
}

export async function deleteLead(formData: FormData) {
  await requirePermission("leads", "delete");
  const id = str(formData, "id");
  await db.lead.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Lead", entityId: id, summary: "Лид устгасан" });
  revalidatePath("/admin/leads");
}

export async function toggleContactRead(formData: FormData) {
  await requirePermission("leads", "update");
  await db.contactMessage.update({
    where: { id: str(formData, "id") },
    data: { read: bool(formData, "read") },
  });
  revalidatePath("/admin/contacts");
}

export async function deleteContact(formData: FormData) {
  await requirePermission("leads", "delete");
  const id = str(formData, "id");
  await db.contactMessage.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "ContactMessage", entityId: id, summary: "Зурвас устгасан" });
  revalidatePath("/admin/contacts");
}

export async function setMeetingStatus(formData: FormData) {
  await requirePermission("leads", "update");
  const id = str(formData, "id");
  const status = str(formData, "status");
  await db.meeting.update({ where: { id }, data: { status: status as never } });
  await logActivity({ action: "UPDATE", entity: "Meeting", entityId: id, summary: `Уулзалт төлөв: ${status}` });
  revalidatePath("/admin/meetings");
}

export async function deleteMeeting(formData: FormData) {
  await requirePermission("leads", "delete");
  const id = str(formData, "id");
  await db.meeting.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Meeting", entityId: id, summary: "Уулзалт устгасан" });
  revalidatePath("/admin/meetings");
}

export async function setBriefStatus(formData: FormData) {
  await requirePermission("leads", "update");
  const id = str(formData, "id");
  const status = str(formData, "status");
  await db.projectBrief.update({ where: { id }, data: { status: status as never } });
  await logActivity({ action: "UPDATE", entity: "ProjectBrief", entityId: id, summary: `Бриф төлөв: ${status}` });
  revalidatePath("/admin/briefs");
  revalidatePath(`/admin/briefs/${id}`);
}

/** Admin sets/adjusts the final quote, note and (optional) meeting date. */
export async function saveQuote(formData: FormData) {
  await requirePermission("leads", "update");
  const id = str(formData, "id");
  const fqRaw = str(formData, "finalQuote").replace(/[^\d]/g, "");
  await db.projectBrief.update({
    where: { id },
    data: {
      finalQuote: fqRaw ? Number(fqRaw) : null,
      quoteNote: optStr(formData, "quoteNote") ?? null,
      meetingAt: optStr(formData, "meetingAt") ?? null,
    },
  });
  await logActivity({ action: "UPDATE", entity: "ProjectBrief", entityId: id, summary: `Үнэлгээ хадгалсан` });
  revalidatePath(`/admin/briefs/${id}`);
  revalidatePath("/admin/briefs");
}

/** Emails the approved final quote to the customer. */
export async function sendQuoteEmail(formData: FormData) {
  await requirePermission("leads", "update");
  const { sendEmail, escapeHtml } = await import("@/lib/mail");
  const { siteConfig } = await import("@/lib/site");
  const { formatMnt } = await import("@/lib/estimate");
  const id = str(formData, "id");
  const b = await db.projectBrief.findUnique({ where: { id } });
  if (!b) return;

  const amount =
    b.finalQuote != null
      ? formatMnt(b.finalQuote)
      : `${formatMnt(b.estimateMin)} – ${formatMnt(b.estimateMax)}`;

  await sendEmail({
    to: b.email,
    replyTo: siteConfig.email,
    subject: `Таны төслийн үнийн санал — ${siteConfig.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#2563EB;margin:0 0 4px">${siteConfig.name}</h2>
        <p style="color:#666;margin:0 0 16px">${siteConfig.address} · ${siteConfig.phone}</p>
        <p>Сайн байна уу, ${escapeHtml(b.name)}.</p>
        <p>Таны илгээсэн төслийн брифийг үндэслэн дараах үнийн саналыг хүргүүлж байна:</p>
        <p style="font-size:24px;font-weight:800;color:#0A0A0A">${amount}</p>
        ${b.quoteNote ? `<p style="white-space:pre-line">${escapeHtml(b.quoteNote)}</p>` : ""}
        ${b.meetingAt ? `<p><strong>Санал болгож буй уулзалтын цаг:</strong> ${escapeHtml(b.meetingAt)}</p>` : ""}
        <p>Дэлгэрэнгүй ярилцахыг хүсвэл энэ имэйлд хариулна уу, эсвэл ${siteConfig.phone} дугаараар холбогдоорой.</p>
        <p style="color:#666">Хүндэтгэсэн,<br/>${siteConfig.name}</p>
      </div>`,
  });

  await db.projectBrief.update({ where: { id }, data: { quoteSentAt: new Date(), status: "CONTACTED" } });
  await logActivity({ action: "UPDATE", entity: "ProjectBrief", entityId: id, summary: `Үнийн санал имэйлээр илгээсэн → ${b.email}` });
  revalidatePath(`/admin/briefs/${id}`);
  revalidatePath("/admin/briefs");
}

export async function deleteBrief(formData: FormData) {
  await requirePermission("leads", "delete");
  const id = str(formData, "id");
  await db.projectBrief.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "ProjectBrief", entityId: id, summary: "Бриф устгасан" });
  revalidatePath("/admin/briefs");
}

// ---------------- Site settings (logo) ----------------

/** Set the site logo URL (callable directly from a client component). */
export async function setLogoUrl(url: string) {
  await requirePermission("settings", "update");
  const value = url.trim();
  if (value) {
    await db.siteSetting.upsert({
      where: { key: "logoUrl" },
      update: { value },
      create: { key: "logoUrl", value },
    });
  } else {
    await db.siteSetting.deleteMany({ where: { key: "logoUrl" } });
  }
  revalidateTag(SETTINGS_TAG);
  await logActivity({ action: "UPDATE", entity: "SiteSetting", summary: value ? "Лого шинэчилсэн" : "Лого арилгасан" });
  revalidatePath("/admin/settings");
}

/** Reset to the built-in vector logo. */
export async function resetLogo() {
  await requirePermission("settings", "update");
  await db.siteSetting.deleteMany({ where: { key: "logoUrl" } });
  revalidateTag(SETTINGS_TAG);
  await logActivity({ action: "UPDATE", entity: "SiteSetting", summary: "Лого анхны хэлбэрт буцаасан" });
  revalidatePath("/admin/settings");
}

// ---------------- AI chat sessions ----------------

export async function deleteChat(formData: FormData) {
  await requirePermission("leads", "delete");
  const id = str(formData, "id");
  await db.chatSession.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "ChatSession", entityId: id, summary: "AI чат устгасан" });
  revalidatePath("/admin/chats");
}
