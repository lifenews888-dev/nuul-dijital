import { Globe, Mail, Server, Shield, type LucideIcon } from "lucide-react";

export type InfrastructureProduct = {
  id: "domains" | "hosting" | "email" | "ssl";
  href: string;
  icon: LucideIcon;
  accent?: "blue" | "cyan";
};

export const infrastructureProducts: InfrastructureProduct[] = [
  { id: "domains", href: "/domains", icon: Globe, accent: "blue" },
  { id: "hosting", href: "/hosting", icon: Server, accent: "blue" },
  { id: "email", href: "/business-email", icon: Mail, accent: "cyan" },
  { id: "ssl", href: "/ssl", icon: Shield, accent: "cyan" },
];