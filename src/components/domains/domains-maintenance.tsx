import { Globe, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export async function DomainsMaintenance() {
  const t = await getTranslations("domains.maintenance");

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
      />
      <section className="container-wide pb-24">
        <Reveal>
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-white/10 bg-card/80 px-8 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Globe className="size-8" aria-hidden />
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">{t("body")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="gradient" asChild>
                <Link href="/contact">
                  <Mail />
                  {t("contact")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quote">{t("quote")}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}