import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers";

/**
 * Хөтөч талын tRPC клиент — React Query-гүй.
 *
 * `@trpc/react-query`-ийн provider нь кэш, хүчингүй болголт, optimistic
 * update авчирна; 3a шатад бидэнд тэдний нэг ч хэрэггүй: товч дарж,
 * сервер төлөвийг солиод, `router.refresh()` нь серверийн компонентыг
 * дахин татна. Provider-ийг мэдээ засварлагч (3b) өөрийн хэрэгцээтэйгээ
 * хамт нэмнэ — өмнө нь нэмэх нь хэрэглэгчгүй дэд бүтэц.
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});

/**
 * tRPC-ийн алдаанаас хүнд харуулах мессеж.
 *
 * Серверийн мессежүүд монгол (`Энэ үйлдлийн эрх алга`, `Мэдээ олдсонгүй`)
 * тул тэднийг шууд харуулна. Сүлжээний алдаа нь англи, танихгүй тул
 * ерөнхий мессежээр солино — «TypeError: Failed to fetch» гэж редакторт
 * үзүүлэх нь юу ч хэлэхгүй.
 */
export function trpcMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const mongolian = /[\u0400-\u04FF]/.test(message);
  return mongolian ? message : "Холболтын алдаа — дахин оролдоно уу";
}
