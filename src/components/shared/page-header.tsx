import { GradientMesh } from "./gradient-mesh";
import { Reveal } from "@/components/motion/reveal";

export function PageHeader({
  label,
  title,
  description,
}: {
  label?: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-36 lg:pt-44">
      <GradientMesh />
      <div className="container-wide">
        <div className="max-w-3xl">
          {label && (
            <Reveal>
              <span className="section-label">
                <span className="size-1.5 rounded-full bg-accent" />
                {label}
              </span>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-display-xl font-extrabold tracking-tight">{title}</h1>
          </Reveal>
          {description && (
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{description}</p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
