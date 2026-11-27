import type { TenantClient } from "./tenant-db";

/**
 * Үйл явдлын бүртгэл — `pn_activity`.
 *
 * Бичих мутаци БҮР нэг мөр үлдээнэ. Үгүй бол «хэн нийтэлсэн», «хэн
 * буцаасан», «хэн устгасан» гэдэг хариулт байхгүй болно — редакцын
 * систем нь хүмүүсийн хоорондын гар дамжуулалт, тэр дамжуулалтыг
 * бүртгэхгүй бол эрх зүйн хувьд ч, ажлын хувьд ч тайлагдахгүй.
 *
 * `postId` нь FK БИШ (схемд relation байхгүй): устгасан мэдээний
 * бүртгэл `postId: null`-тай үлдэж, мөр нь хаягдахгүй.
 */

/** Бүртгэлийн тайлбарын дээд урт — admin.html-ийн `note.slice(0,1000)` */
export const NOTE_MAX = 1000;

export type ActivityInput = {
  tenantId: string;
  postId: string | null;
  userId: string;
  action: string;
  note?: string | null;
};

export async function logActivity(db: TenantClient, input: ActivityInput): Promise<void> {
  const note = input.note?.trim();

  await db.newsActivity.create({
    data: {
      tenantId: input.tenantId,
      postId: input.postId,
      userId: input.userId,
      action: input.action,
      note: note ? note.slice(0, NOTE_MAX) : null,
    },
  });
}
