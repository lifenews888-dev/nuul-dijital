import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { publishedWhere } from "./posts";

/**
 * Нэг хуулийн төслийн нийтийн хуудас.
 *
 * ХААЛГА: төсөл нь мэдээтэй холбоотой байж болох ба тэр мэдээ НООРОГ байж
 * болно. Тэр үед мэдээний гарчиг, slug-ийг гаргахгүй — эс бөгөөс
 * нийтлэгдээгүй ажил хуулийн хуудсаар дамжин харагдана. Төслийн ӨӨРИЙН
 * мэдээлэл (нэр, шат, санал) нь нийтийн баримт тул үлдэнэ.
 */
export type BillStep = {
  index: number;
  date: Date | null;
  note: string | null;
  sources: string[];
};

export type BillPage = {
  id: string;
  title: string;
  stage: number;
  votesYes: number;
  votesNo: number;
  steps: BillStep[];
  updatedAt: Date;
  /** Холбогдох НИЙТЛЭГДСЭН мэдээ. Ноорог бол `null`. */
  post: { slug: string; title: string } | null;
};

export async function billById(id: string): Promise<BillPage | null> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);

  const row = await db.bill.findFirst({
    where: { id },
    include: { stages: { orderBy: { index: "asc" } } },
  });
  if (!row) return null;

  const post = row.postId
    ? await db.newsPost.findFirst({
        where: { ...publishedWhere(), id: row.postId },
        select: { slug: true, title: true },
      })
    : null;

  return {
    id: row.id,
    title: row.title,
    stage: row.stage,
    votesYes: row.votesYes,
    votesNo: row.votesNo,
    steps: row.stages.map((s) => ({
      index: s.index,
      date: s.date,
      note: s.note,
      sources: s.sources,
    })),
    updatedAt: row.updatedAt,
    post,
  };
}

/** Бүх төсөл — жагсаалтын хуудас ба sitemap-д */
export async function allBills(): Promise<
  { id: string; title: string; stage: number; updatedAt: Date }[]
> {
  const tenant = await requireTenant();
  return forTenant(tenant.id).bill.findMany({
    orderBy: [{ stage: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, stage: true, updatedAt: true },
    take: 200,
  });
}
