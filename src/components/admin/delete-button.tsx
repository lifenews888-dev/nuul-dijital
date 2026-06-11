"use client";

import { Trash2 } from "lucide-react";

/**
 * Renders a form bound to a server action with a confirm() guard.
 * `action` is a Next.js Server Action passed from a server component.
 */
export function DeleteButton({
  action,
  id,
  label = "Устгах уу?",
}: {
  action: (formData: FormData) => void;
  id: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(label)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
        aria-label="Устгах"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
