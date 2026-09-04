import { Home, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/gradient-mesh";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden">
      <GradientMesh />
      <div className="container-wide text-center">
        <div className="text-gradient-accent text-[8rem] font-black leading-none sm:text-[12rem]">
          404
        </div>
        <h1 className="mt-4 text-3xl font-bold">{t("pages.notFound.title")}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {t("pages.notFound.description")}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="gradient">
            <Link href="/">
              <Home className="size-4" /> {t("pages.notFound.home")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">
              <ArrowLeft className="size-4" /> {t("nav.contact")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
