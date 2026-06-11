import {
  Search,
  PenTool,
  Code2,
  Rocket,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Registry mapping a stored icon NAME (string, DB/CMS-safe) to its Lucide
 * component. Used to render process steps whose icon is editable in the admin.
 */
export const ICONS: Record<string, LucideIcon> = {
  Search,
  PenTool,
  Code2,
  Rocket,
  TrendingUp,
  Sparkles,
};

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}
