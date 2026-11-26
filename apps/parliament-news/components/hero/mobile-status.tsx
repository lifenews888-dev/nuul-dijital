import { SEATS } from "../../lib/hemicycle";
import type { LiveInfo } from "../../lib/home-data";

/**
 * Утсан дээрх нэг мөрийн зурвас — artifact-ийн `#mstat` (index.html:587).
 *
 * Нарийн дэлгэцэд `.wg` виджетүүд нуугддаг тул хуралдааны төлөв ба ирц
 * энд нэг мөрөнд гарна. Өргөн дэлгэцэд CSS нь үүнийг нуудаг.
 */
export function MobileStatus({ live }: { live: LiveInfo | null }) {
  if (!live) return null;
  return (
    <div className="mstat lbl" id="mstat">
      {live.sessionStatus} · Ирц {live.attendance}/{SEATS}
    </div>
  );
}
