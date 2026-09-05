import {
  AppWindow,
  Bot,
  Boxes,
  BrainCircuit,
  Cloud,
  DatabaseBackup,
  FileLock2,
  FileText,
  Fingerprint,
  Globe,
  HardDrive,
  Layers,
  Mail,
  Megaphone,
  Palette,
  PencilRuler,
  Radar,
  Router,
  ScanSearch,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  TabletSmartphone,
  UserCog,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons the catalogue can use, keyed by name.
 *
 * A database row cannot hold a React component, so admin-managed services and
 * vendors store one of these keys and the content layer resolves it back to a
 * component. The keys are the Lucide export names, which keeps the seed script
 * a direct translation of the bundled static catalogues.
 */
export const ICON_REGISTRY = {
  AppWindow,
  Bot,
  Boxes,
  BrainCircuit,
  Cloud,
  DatabaseBackup,
  FileLock2,
  FileText,
  Fingerprint,
  Globe,
  HardDrive,
  Layers,
  Mail,
  Megaphone,
  Palette,
  PencilRuler,
  Radar,
  Router,
  ScanSearch,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  TabletSmartphone,
  UserCog,
  Workflow,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICON_REGISTRY;

export const ICON_KEYS = Object.keys(ICON_REGISTRY) as IconKey[];

/** Resolves a stored key, falling back to a neutral icon for unknown values. */
export function getIcon(key: string | null | undefined): LucideIcon {
  return (key && ICON_REGISTRY[key as IconKey]) || Sparkles;
}

/** The key for a component, so the seed can translate the static catalogues. */
export function iconKeyOf(icon: LucideIcon): IconKey {
  const found = ICON_KEYS.find((k) => ICON_REGISTRY[k] === icon);
  return found ?? "Sparkles";
}
