/** Редакцын хэсэг ба түүний дотор нэвтрэлтгүй үзэх зөвшөөрөгдсөн зам */
const STUDIO_ROOT = "/studio";
const STUDIO_PUBLIC = ["/studio/signin"];

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

/**
 * /studio-ийн зам нэвтрэлт шаардаж байна уу.
 *
 * startsWith("/studio/signin") гэж шалгавал /studio/signin-anything гэх мэт
 * зам нэвтрэлтээс мултарна, тиймээс замын зааг (/ эсвэл төгсгөл) дээр таарна.
 */
export function needsStudioAuth(pathname: string): boolean {
  if (!isUnder(pathname, STUDIO_ROOT)) return false;
  return !STUDIO_PUBLIC.some((base) => isUnder(pathname, base));
}
