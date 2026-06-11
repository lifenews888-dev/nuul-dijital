import { cn } from "@/lib/utils";

/** Ambient brand background: radial accent glow + faint grid + noise. */
export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-grid-dark [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-radial-fade blur-3xl" />
      <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-cyan/10 blur-[120px]" />
    </div>
  );
}
