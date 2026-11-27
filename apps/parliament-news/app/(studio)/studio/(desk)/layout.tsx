import { requireStudio } from "../../../../lib/studio-session";
import { navFor } from "../../../../lib/studio-nav";
import { ROLE_LABELS } from "../../../../lib/permissions";
import { StudioNav } from "../../../../components/studio/studio-nav";

/**
 * РЕДАКЦЫН АЖЛЫН ТАЛБАР — энэ бол ХААЛГА.
 *
 * `middleware.ts` нь Edge дээр «токен байна уу» гэдгийг л шалгана.
 * `TenantMember`-гүй хэрэглэгч токентой байж чадна (нэг санд nuul.mn-ийн
 * хэрэглэгч ч бий) — тэр хүн `/studio/news` руу замаар шууд орвол ЭНД
 * таслагдана, middleware-д биш. Хуудас бүр өөрөө шалгахыг хүлээхгүй:
 * бүрхүүл нь өгөгдөл уншихаас ӨМНӨ зогсооно.
 */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const { actor, name, email } = await requireStudio();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <StudioNav
        items={navFor(actor)}
        name={name ?? email}
        role={ROLE_LABELS[actor.role].name}
      />

      <main className="w-full max-w-[1320px] flex-1 px-4 pb-16 pt-5 md:px-[clamp(16px,3vw,40px)] md:pt-6">
        {children}
      </main>
    </div>
  );
}
