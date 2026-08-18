/**
 * Seed placeholder team members (Unsplash portraits) alongside the real ones.
 *
 * Idempotent: skips any member whose name already exists, so it is safe to
 * re-run. Existing rows (e.g. the CEO) are never modified.
 *
 * Usage: npx tsx scripts/seed-team.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Unsplash portraits, cropped to the face so they read well in the square grid. */
const portrait = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=facearea&facepad=2.5&w=480&h=480&q=80`;

const members = [
  { name: "Э. Анударь", role: "Бүтээлч захирал", avatar: portrait("photo-1494790108377-be9c29b29330") },
  { name: "Ч. Батбаяр", role: "Технологийн захирал", avatar: portrait("photo-1500648767791-00dcc994a43e") },
  { name: "О. Сарангэрэл", role: "Тэргүүлэх дизайнер", avatar: portrait("photo-1438761681033-6461ffad8d80") },
  { name: "Б. Мөнхзул", role: "AI инженер", avatar: portrait("photo-1544005313-94ddf0286df2") },
  { name: "Т. Нямбаяр", role: "Төслийн менежер", avatar: portrait("photo-1507003211169-0a1dd7228f2d") },
  { name: "Д. Ганбаатар", role: "Ахлах хөгжүүлэгч", avatar: portrait("photo-1472099645785-5658abf4ff4e") },
  { name: "С. Оюунчимэг", role: "UI/UX дизайнер", avatar: portrait("photo-1580489944761-15a19d654956") },
  { name: "Г. Энхтайван", role: "DevOps инженер", avatar: portrait("photo-1568602471122-7832951cc4c5") },
  { name: "Н. Алтанцэцэг", role: "Маркетингийн менежер", avatar: portrait("photo-1517841905240-472988babdf9") },
];

async function main() {
  const existing = await db.teamMember.findMany({ select: { name: true, order: true } });
  const taken = new Set(existing.map((m) => m.name));
  let order = existing.reduce((max, m) => Math.max(max, m.order), 0);

  let added = 0;
  for (const m of members) {
    if (taken.has(m.name)) {
      console.log(`↷ skip (already exists): ${m.name}`);
      continue;
    }
    order += 1;
    await db.teamMember.create({ data: { ...m, order, active: true } });
    console.log(`✅ [${order}] ${m.name} — ${m.role}`);
    added += 1;
  }

  const total = await db.teamMember.count({ where: { active: true } });
  console.log(`\nAdded ${added}, active team members now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
