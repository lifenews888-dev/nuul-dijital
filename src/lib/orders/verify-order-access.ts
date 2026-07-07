import type { AppContext } from "@/lib/app";
import { normalizeLookupEmail } from "@/lib/domains/order-lookup";

type OwnableOrder = {
  customerEmail: string;
  orgId: string | null;
  userId: string | null;
};

export function orderBelongsToCustomer(order: OwnableOrder, ctx: AppContext): boolean {
  if (order.userId === ctx.user.id) return true;
  if (order.orgId === ctx.organization.id) return true;
  return normalizeLookupEmail(order.customerEmail) === normalizeLookupEmail(ctx.user.email);
}