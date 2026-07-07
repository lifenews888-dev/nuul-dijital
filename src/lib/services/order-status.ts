import type { ServiceType } from "@prisma/client";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  HOSTING: "Хостинг",
  EMAIL: "Бизнес имэйл",
};

export const SERVICE_ORDER_ACTION_LABELS: Partial<Record<string, string>> = {
  FULFILLING: "Тохируулга эхлүүлэх",
  COMPLETED: "Үйлчилгээ идэвхжүүлсэн",
  CANCELLED: "Цуцлах",
  REFUNDED: "Буцаан олголт",
};

export const PLAN_KEY_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  basic: "Basic",
  team: "Team",
};