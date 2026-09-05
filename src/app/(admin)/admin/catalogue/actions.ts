"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { str, optStr, num, bool, lines, requirePermission } from "@/lib/admin";
import { logActivity } from "@/lib/activity";

/**
 * Catalogue mutations — services, software vendors and software categories.
 *
 * These sit in their own file rather than the main actions module because the
 * catalogue is a distinct area with its own routes. Every write revalidates the
 * content tag, which is what flips the public pages from the bundled fallback
 * to the database rows.
 */

/** An empty numeric field means "no price", not zero. */
const optNum = (fd: FormData, k: string): number | null => {
  const raw = str(fd, k);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// ---------------- Services ----------------

export async function saveService(formData: FormData) {
  await requirePermission("content", "update");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    short: str(formData, "short"),
    description: str(formData, "description"),
    features: lines(formData, "features"),
    deliverables: lines(formData, "deliverables"),
    icon: str(formData, "icon"),
    accent: optStr(formData, "accent"),
    image: optStr(formData, "image"),
    gallery: lines(formData, "gallery"),
    videoUrl: optStr(formData, "videoUrl"),
    priceMnt: optNum(formData, "priceMnt"),
    priceNote: optStr(formData, "priceNote"),
    featured: bool(formData, "featured"),
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id
    ? await db.service.update({ where: { id }, data })
    : await db.service.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "Service",
    entityId: saved.id,
    summary: `Үйлчилгээ: ${data.title}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/services");
  redirect("/admin/catalogue/services");
}

export async function deleteService(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.service.delete({ where: { id } });
  await logActivity({ action: "DELETE", entity: "Service", entityId: id, summary: "Үйлчилгээ устгасан" });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/services");
}

// ---------------- Software vendors ----------------

export async function saveSoftwareVendor(formData: FormData) {
  await requirePermission("content", "update");
  const id = optStr(formData, "id");
  const categorySlugs = formData.getAll("categories").map(String).filter(Boolean);
  const data = {
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    tagline: str(formData, "tagline"),
    description: str(formData, "description"),
    products: lines(formData, "products"),
    editions: lines(formData, "editions"),
    audience: str(formData, "audience"),
    focus: str(formData, "focus"),
    icon: str(formData, "icon"),
    accent: optStr(formData, "accent"),
    image: optStr(formData, "image"),
    gallery: lines(formData, "gallery"),
    videoUrl: optStr(formData, "videoUrl"),
    priceMnt: optNum(formData, "priceMnt"),
    priceNote: optStr(formData, "priceNote"),
    featured: bool(formData, "featured"),
    priority: num(formData, "priority", 0),
    active: bool(formData, "active"),
  };
  const links = categorySlugs.map((slug) => ({ slug }));
  const saved = id
    ? // `set` replaces the links wholesale, so unticking a box removes it.
      await db.softwareVendor.update({ where: { id }, data: { ...data, categories: { set: links } } })
    : await db.softwareVendor.create({ data: { ...data, categories: { connect: links } } });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "SoftwareVendor",
    entityId: saved.id,
    summary: `Үйлдвэрлэгч: ${data.name}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/software");
  redirect("/admin/catalogue/software");
}

export async function deleteSoftwareVendor(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.softwareVendor.delete({ where: { id } });
  await logActivity({
    action: "DELETE",
    entity: "SoftwareVendor",
    entityId: id,
    summary: "Үйлдвэрлэгч устгасан",
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/software");
}

// ---------------- Software categories ----------------

export async function saveSoftwareCategory(formData: FormData) {
  await requirePermission("content", "update");
  const id = optStr(formData, "id");
  const data = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    group: str(formData, "group"),
    order: num(formData, "order", 0),
    active: bool(formData, "active"),
  };
  const saved = id
    ? await db.softwareCategory.update({ where: { id }, data })
    : await db.softwareCategory.create({ data });
  await logActivity({
    action: id ? "UPDATE" : "CREATE",
    entity: "SoftwareCategory",
    entityId: saved.id,
    summary: `Ангилал: ${data.title}`,
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/categories");
  redirect("/admin/catalogue/categories");
}

export async function deleteSoftwareCategory(formData: FormData) {
  await requirePermission("content", "delete");
  const id = str(formData, "id");
  await db.softwareCategory.delete({ where: { id } });
  await logActivity({
    action: "DELETE",
    entity: "SoftwareCategory",
    entityId: id,
    summary: "Ангилал устгасан",
  });
  revalidateTag(CONTENT_TAG);
  revalidatePath("/admin/catalogue/categories");
}
