import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export function CTASection() {
  return (
    <section className="py-12 lg:py-20">
      <div className="container-wide">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-accent-gradient px-6 py-16 text-center sm:px-12 sm:py-24">
            <div className="absolute inset-0 bg-grid-dark [background-size:40px_40px] opacity-30" />
            <div className="absolute -left-20 -top-20 size-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-accent-cyan/40 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance text-display-lg font-bold tracking-tight text-white">
                Төслөө эхлүүлэхэд бэлэн үү?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
                Үнэ төлбөргүй зөвлөгөө аваарай. Бид таны санааг бодит, үр дүнтэй дижитал
                бүтээгдэхүүн болгон хувиргахад туслана.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild variant="light" size="lg">
                  <Link href="/quote">
                    Үнийн санал авах <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  <Link href="/contact">Холбоо барих</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
