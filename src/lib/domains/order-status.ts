import type { DomainOrderStatus } from "@prisma/client";

export const DOMAIN_ORDER_STATUS_LABELS: Record<DomainOrderStatus, string> = {
  DRAFT: "Ноорог",
  PENDING_PAYMENT: "Төлбөр хүлээгдэж буй",
  PAID: "Төлсөн",
  FULFILLING: "Бүртгэж байна",
  COMPLETED: "Дууссан",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
  EXPIRED: "Хугацаа дууссан",
};

/** Valid admin transitions (target statuses from each source). */
export const DOMAIN_ORDER_TRANSITIONS: Partial<Record<DomainOrderStatus, DomainOrderStatus[]>> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["FULFILLING", "CANCELLED", "REFUNDED"],
  FULFILLING: ["COMPLETED", "CANCELLED", "REFUNDED"],
};

export const DOMAIN_ORDER_ACTION_LABELS: Partial<Record<DomainOrderStatus, string>> = {
  FULFILLING: "Бүртгэл эхлүүлэх",
  COMPLETED: "Домэйн бүртгэл дууссан",
  CANCELLED: "Цуцлах",
  REFUNDED: "Буцаан олголт",
};

export function canTransition(from: DomainOrderStatus, to: DomainOrderStatus): boolean {
  return DOMAIN_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresManagePermission(to: DomainOrderStatus): boolean {
  return to === "REFUNDED";
}

export const REGISTRANT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Хувь хүн",
  BUSINESS: "Байгууллага",
};

export const ID_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: "Иргэний үнэмлэх",
  PASSPORT: "Паспорт",
  OTHER: "Бусад",
};