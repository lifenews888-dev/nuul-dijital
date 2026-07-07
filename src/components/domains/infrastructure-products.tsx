"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { infrastructureProducts } from "@/data/infrastructure-products";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showDomains?: boolean;
};

export function InfrastructureProducts({ className, showDomains = true }: Props) {
  const t = useTranslations("infraProducts");
  const items = showDomains
    ? infrastructureProducts
    : infrastructureProducts.filter((p) => p.id !== "domains");

  return (
    <section className={cn("py-12 lg:py-16", className)}>
      <Reveal>
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("label")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight lg:text-3xl">{t("title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("description")}</p>
        </div>
      </Reveal>

      <div
        className={cn(
          "grid gap-4",
          items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {items.map((product, i) => {
          const Icon = product.icon;
          return (
            <Reveal key={product.id} delay={i * 0.05}>
              <Link
                href={product.href}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl",
                      product.accent === "cyan"
                        ? "bg-accent-cyan/10 text-accent-cyan"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <ArrowUpRight className="size-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-accent" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t(`${product.id}.title`)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`${product.id}.short`)}
                </p>
                <span className="mt-4 text-sm font-medium text-accent">{t("cta")}</span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}