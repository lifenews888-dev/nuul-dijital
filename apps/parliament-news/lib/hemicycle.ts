/**
 * Ирцийн хагас дугуй — artifact-ийн `drawHemi()` (index.html:842).
 *
 * Зургаан нуман эгнээнд 126 суудлыг тарааж, өнцгөөр эрэмбэлнэ. Дүүрсэн
 * суудлыг `(i*37) % 126 < attendance`-ээр сонгоно: 37 ба 126 нь харилцан
 * анхны тул энэ нь 0..125-ийн СЭЛГЭЭ — дүүрсэн тоо нь яг ирцтэй тэнцүү
 * бөгөөд танхимд жигд тарсан харагдана, зүүн талдаа бөөгнөрөхгүй.
 */
export const SEATS = 126;

/** `drawHemi`-ийн эгнээний радиусууд, `viewBox="0 0 220 116"`-д */
const RADII = [44, 56, 68, 80, 92, 104];
const CX = 110;
const CY = 110;
/** Сэлгээний алхам — 126-тай харилцан анхны байх ёстой */
const STRIDE = 37;

export type Seat = { cx: number; cy: number; filled: boolean };

export function hemicycleDots(attendance: number): Seat[] {
  const total = RADII.reduce((a, b) => a + b, 0);
  const points: { x: number; y: number; angle: number }[] = [];

  for (const r of RADII) {
    const n = Math.round((SEATS * r) / total);
    for (let i = 0; i < n; i++) {
      const angle = Math.PI + (Math.PI * (i + 0.5)) / n;
      points.push({
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle),
        angle,
      });
    }
  }

  const present = Math.max(0, Math.min(SEATS, Math.floor(attendance)));
  return points
    .sort((p, q) => p.angle - q.angle)
    .slice(0, SEATS)
    .map((p, i) => ({
      cx: Number(p.x.toFixed(1)),
      cy: Number(p.y.toFixed(1)),
      filled: (i * STRIDE) % SEATS < present,
    }));
}
