import { getIcon } from "@/lib/icon-registry";

/**
 * Renders a catalogue icon from its registry key.
 *
 * Catalogue entries carry a key rather than a component, because a component
 * survives neither the content cache nor the server-to-client boundary. This
 * turns the key back into an icon at the point of render, which is the only
 * place it needs to be one.
 */
export function RegistryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getIcon(name);
  return <Icon className={className} />;
}
