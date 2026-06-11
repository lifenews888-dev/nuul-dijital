import { Mail, Phone, MapPin, Clock, MessageSquare, CalendarCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/contact-form";
import { MeetingForm } from "@/components/forms/meeting-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { siteConfig } from "@/lib/site";

export async function ContactSection() {
  const t = await getTranslations("home.contact");
  const details = [
    { icon: Mail, label: t("email"), value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { icon: Phone, label: t("phone"), value: siteConfig.phone, href: `tel:${siteConfig.phone}` },
    { icon: MapPin, label: t("address"), value: siteConfig.address },
    { icon: Clock, label: t("responseTime"), value: t("responseValue") },
  ];
  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              label={t("label")}
              title={t.rich("title", {
                accent: (c) => <span className="text-gradient-accent">{c}</span>,
              })}
              description={t("description")}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label} className="rounded-2xl border border-white/10 bg-card p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <d.icon className="size-5" />
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                    {d.label}
                  </div>
                  {d.href ? (
                    <a href={d.href} className="text-sm font-medium hover:text-accent">
                      {d.value}
                    </a>
                  ) : (
                    <div className="text-sm font-medium">{d.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
            <Tabs defaultValue="message">
              <TabsList>
                <TabsTrigger value="message">
                  <MessageSquare className="size-4" /> {t("tabMessage")}
                </TabsTrigger>
                <TabsTrigger value="meeting">
                  <CalendarCheck className="size-4" /> {t("tabMeeting")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="message">
                <ContactForm />
              </TabsContent>
              <TabsContent value="meeting">
                <MeetingForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}
