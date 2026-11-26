/**
 * Hero дүр зураг — artifact-ийн `site-v2/index.html`-ийн бүтцээр.
 *
 * `div.hero` нь БҮРХҮҮЛ БИШ: тэр нь далбааны зурагтай, доошоо бүдгэрдэг
 * дэвсгэрийн давхарга (`aria-hidden`). Толгой, виджет, тавиур бүгд түүний
 * ах дүү нар — төлөвлөгөөнд `<Hero>{children}</Hero>` гэж буруу таамагласныг
 * ledger-т тэмдэглэв.
 *
 * Давхаргын дараалал (artifact-ийн дагуу):
 *   .hero   далбааны дэвсгэр (z 1)
 *   .cityw  хотын дүрс, 3D тайз (z 1) — агуулгыг нь тавиурын давталт зурна
 *   .plat   тавцан,  .floor  шалны сүүдэр
 *   nav2 … (толгойг layout зурна, `.top` нь fixed z 58)
 *   .grain  цаасны ширхэг (z 40)
 *   #probe  --H-ийн бодит px утгыг хэмжих элемент
 *   #mstat  утсан дээрх нэг мөрийн төлөв (өргөн дэлгэцэд CSS нуудаг)
 */
import { MobileStatus } from "./mobile-status";
import type { LiveInfo } from "../../lib/home-data";
export function Hero({
  live,
  children,
}: {
  live?: LiveInfo | null;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="hero" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Толгойг layout зурна — artifact-д ч `.top` нь position:fixed, z 58
          тул бүх хуудсанд нэг л удаа байх ёстой. */}
      <nav className="nav2 lbl" id="nav2" aria-label="Ангилал" />

      <MobileStatus live={live ?? null} />

      {/* Хотын дүрс: 3D тайз, агуулгыг нь тавиурын rAF давталт барина */}
      <div className="cityw" aria-hidden="true">
        <div className="city">
          <div className="cst" id="cst" />
        </div>
      </div>
      <div className="plat" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />

      {/* `--H`-ийн бодит px утгыг эндээс хэмжинэ — тавиурын геометр үүнээс эхэлнэ */}
      <div
        id="probe"
        aria-hidden="true"
        style={{
          position: "fixed",
          height: "var(--H)",
          width: 1,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />

      {children}
    </>
  );
}
