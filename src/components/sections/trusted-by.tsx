import { getTranslations } from "next-intl/server";
import { Marquee } from "@/components/motion/marquee";
import { techStack } from "@/data/company";

export async function TrustedBy() {
  const t = await getTranslations("home.trustedBy");
  return (
    <section className="border-y border-white/5 py-14">
      <div className="container-wide">
        <p className="mb-10 text-center text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("label")}
        </p>
      </div>
      <Marquee speed={32}>
        {techStack.map((t) => (
          <div
            key={t.name}
            className="group flex shrink-0 items-center gap-3 opacity-50 transition-opacity duration-300 hover:opacity-100"
            title={t.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://cdn.simpleicons.org/${t.slug}/ffffff`}
              alt={`${t.name} лого`}
              width={28}
              height={28}
              loading="lazy"
              className="h-7 w-7 object-contain"
            />
            <span className="whitespace-nowrap text-xl font-semibold text-foreground/80 sm:text-2xl">
              {t.name}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
