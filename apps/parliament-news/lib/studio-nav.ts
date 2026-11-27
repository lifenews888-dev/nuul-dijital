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

  /** Сэтгэгдэл нь хянагчаас дээш — admin.html-ийн `v-cm` */
  if (["SUPER", "CHIEF", "REVIEWER"].includes(actor.role)) {
    items.push({ href: "/studio/comments", label: "Сэтгэгдэл" });
  }

  /** Медиа санг гишүүн бүр харна — юу байршуулснаа мэдэх нь энгийн зүйл */
  items.push({ href: "/studio/media", label: "Медиа сан" });

  if (canEditSettings(actor)) {
    items.push({ href: "/studio/settings", label: "Сайтын тохиргоо" });
  }

  /** Багийн жагсаалтыг бүгд харна, засах нь зөвхөн супер админд */
  items.push({ href: "/studio/users", label: "Баг ба эрх" });

  return items;
}
