import { Link } from "@/i18n/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerNav, siteConfig } from "@/lib/site";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Logo } from "@/components/shared/logo";

export function Footer({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink">
      <div className="absolute -top-40 left-1/2 h-80 w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <div className="container-wide relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={logoUrl ? 60 : 40} src={logoUrl} />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.tagline}. Монголын байгууллагуудын дижитал шилжилтийг
              түргэсгэдэг орчин үеийн агентлаг.
            </p>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-3 hover:text-foreground">
                <Mail className="size-4 text-accent" /> {siteConfig.email}
              </a>
              <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-3 hover:text-foreground">
                <Phone className="size-4 text-accent" /> {siteConfig.phone}
              </a>
              <span className="flex items-center gap-3">
                <MapPin className="size-4 text-accent" /> {siteConfig.address}
              </span>
            </div>
          </div>

          {footerNav.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h4 className="text-xl font-semibold">Дижитал инсайтуудыг хүлээн авах</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Технологи, дизайн, бизнесийн өсөлтийн талаарх шилдэг контентыг сард нэг удаа.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <div className="flex items-center gap-5">
            {Object.entries(siteConfig.social).map(([key, href]) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-sm capitalize text-muted-foreground transition-colors hover:text-foreground"
              >
                {key}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
