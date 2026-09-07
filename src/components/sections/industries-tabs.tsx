"use client";

import { ArrowRight, Dot } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { industries } from "@/data/industries";
import { SectionHeading } from "@/components/shared/section-heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * The seven industries, one tab each.
 *
 * The data is imported here rather than passed down from the page: these are
 * static rows, and importing them locally means the Lucide icon on each row is
 * never handed across the server/client boundary, which is where icons on this
 * site have broken before.
 *
 * Every panel is force-mounted and hidden with CSS instead of being unmounted,
 * so all seven industries' copy is in the HTML a crawler receives, not just
 * whichever tab happens to be open.
 *
 * Each panel also links to its industry page. The homepage previously pointed
 * at none of them.
 */
export function IndustriesTabs() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          align="center"
          label="Салбарууд"
          title={
            <>
              Танай салбарт <span className="text-gradient-accent">юу хийдэг вэ</span>
            </>
          }
          description="Салбар бүр өөрийн сорилттой. Танайхыг сонгоод, бид юуг хэрхэн шийддэгийг хараарай."
        />

        <Tabs defaultValue={industries[0].slug} className="mt-12">
          {/* Seven full industry names do not fit on one line, so the strip
              scrolls sideways and fades at both edges rather than wrapping into
              a ragged block. */}
          <div className="mask-fade-x -mx-6 overflow-x-auto px-6 pb-2 lg:-mx-8 lg:px-8">
            <TabsList className="mx-auto flex w-max">
              {industries.map((industry) => (
                <TabsTrigger key={industry.slug} value={industry.slug}>
                  <industry.icon className="size-4" />
                  {industry.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {industries.map((industry) => (
            <TabsContent
              key={industry.slug}
              value={industry.slug}
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <div className="rounded-3xl border border-white/10 bg-card p-7 sm:p-9">
                <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
                  {industry.description}
                </p>

                <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-[1.2fr_1fr]">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Тулгардаг сорилт
                    </h3>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {industry.challenges.map((challenge) => (
                        <li key={challenge} className="flex items-start gap-2">
                          <Dot className="mt-0.5 size-5 shrink-0 text-accent" />
                          <span className="leading-relaxed">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Бидний шийдэл
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {industry.solutions.map((solution) => (
                        <Badge key={solution} variant="accent">
                          {solution}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="mt-6">
                      <Link href={`/industries/${industry.slug}`}>
                        {industry.name} <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
