"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Workflow, Zap, Brain, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

const capabilities = [
  { icon: Brain, text: "Монгол хэл ойлгодог LLM" },
  { icon: MessageSquare, text: "24/7 ухаалаг чатбот" },
  { icon: Workflow, text: "Процессын автоматжуулалт" },
  { icon: Zap, text: "Бодит цагийн интеграц" },
];

const chatDemo = [
  { role: "user", text: "Захиалгын төлөв шалгаж өгөөч?" },
  { role: "bot", text: "Таны #4821 захиалга хүргэлтэд гарсан байна. Маргааш 14:00 цагт хүрнэ 🚚" },
  { role: "user", text: "Баярлалаа!" },
];

export function AISolutions() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-accent/[0.04] to-transparent" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]" />

      <div className="container-wide">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="section-label border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
              <Bot className="size-3.5" />
              AI & Автоматжуулалт
            </span>
            <h2 className="mt-6 text-display-lg font-bold tracking-tight">
              Хиймэл оюун ухааныг{" "}
              <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
                бизнестээ
              </span>{" "}
              нэвтрүүл
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Давтагдах ажлыг автоматжуулж, харилцагчдад 24/7 шуурхай үйлчилгээ үзүүлэх ухаалаг
              AI шийдлүүдийг бид бүтээнэ. Цаг хэмнэ, зардлаа бууруул, өс.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {capabilities.map((c, i) => (
                <Reveal key={c.text} delay={i * 0.05}>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <c.icon className="size-5 shrink-0 text-accent-cyan" />
                    <span className="text-sm font-medium">{c.text}</span>
                  </div>
                </Reveal>
              ))}
            </div>

            <Button asChild variant="gradient" size="lg" className="mt-8">
              <Link href="/services/ai-chatbots">
                AI шийдэл судлах <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>

          {/* Animated chat mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-gradient">
                  <Bot className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Nuul AI Туслах</div>
                  <div className="flex items-center gap-1.5 text-xs text-accent-cyan">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent-cyan" />
                    Онлайн
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 py-5">
                {chatDemo.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.4 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-accent text-white"
                          : "bg-white/5 text-foreground"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 -z-10 size-32 rounded-full bg-accent-cyan/20 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
