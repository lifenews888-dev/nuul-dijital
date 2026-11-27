import { canCreate, canEditSettings, type Actor } from "./permissions";

/**
 * Студийн хажуугийн цэс — admin.html-ийн `.nv` товчнууд, эрхээр нь.
 *
 * `admin.html` нь `$('newBtn').hidden = !canNew()` ба
 * `$('navSet').hidden = !is('super','chief','live')` гэж товчийг нуудаг.
 * Энд мөн тэр дүрэм, гэхдээ эрхийн шийдвэр нь `lib/permissions.ts`-д —
 * хоёр газар хуулбарлавал тэд салж, цэс нь сервер зөвшөөрөхгүй хуудсыг
 * үзүүлж эхэлнэ.
 */
export type NavItem = { href: string; label: string };

export function navFor(actor: Actor): NavItem[] {
  /**
   * Самбар ба жагсаалтыг ҮҮРЭГ БҮР харна — шинжээч ч, оператор ч.
   * Самбар нь нэвтэрмэгц буух хуудас тул эхэнд.
   */
  const items: NavItem[] = [
    { href: "/studio", label: "Самбар" },
    { href: "/studio/news", label: "Мэдээнүүд" },
  ];

  if (canCreate(actor)) {
    items.push({ href: "/studio/news/new", label: "Шинэ мэдээ" });
  }

  if (canEditSettings(actor)) {
    items.push({ href: "/studio/settings", label: "Сайтын тохиргоо" });
  }

  return items;
}
