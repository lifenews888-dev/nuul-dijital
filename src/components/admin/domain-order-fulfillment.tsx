"use client";

import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminMarkOrderPaid,
  saveFulfillmentDetails,
  updateDomainOrderStatus,
  verifyRegistrant,
} from "@/app/admin/domains/actions";
import {
  DOMAIN_ORDER_ACTION_LABELS,
  DOMAIN_ORDER_TRANSITIONS,
} from "@/lib/domains/order-status";
import type { DomainOrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  order: {
    id: string;
    status: DomainOrderStatus;
    registrantVerified: boolean;
    registrarName: string | null;
    registrarOrderId: string | null;
    domainExpiresAt: Date | null;
    adminNotes: string | null;
    paymentCompleted: boolean;
    paymentMethod?: string;
  };
  canManage: boolean;
};

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {done ? (
        <Check className="size-4 shrink-0 text-accent" aria-hidden />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}

export function DomainOrderFulfillment({ order, canManage }: Props) {
  const transitions = DOMAIN_ORDER_TRANSITIONS[order.status] ?? [];
  const paymentDone =
    order.paymentCompleted || ["PAID", "FULFILLING", "COMPLETED"].includes(order.status);
  const domainDone = order.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Бүртгэлийн checklist</h2>
        <ul className="space-y-3">
          <CheckItem done={paymentDone} label="Төлбөр баталгаажсан" />
          <CheckItem done={order.registrantVerified} label="Бүртгэлийн бичиг баримт хүлээн авсан" />
          <CheckItem done={domainDone} label="Registrar дээр домэйн бүртгэгдсэн" />
          <CheckItem done={domainDone} label="Хэрэглэгчид мэдэгдсэн" />
        </ul>
      </div>

      {!order.registrantVerified && ["PAID", "FULFILLING", "PENDING_PAYMENT"].includes(order.status) && (
        <form action={verifyRegistrant} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <input type="hidden" name="id" value={order.id} />
          <p className="text-sm text-amber-200/90">
            Хэрэглэгчийн илгээсэн бичиг баримтыг шалгаад баталгаажуулна уу (иргэний үнэмлэх эсвэл байгууллагын гэрчилгээ).
          </p>
          <Button type="submit" variant="outline" className="mt-4 border-amber-500/30">
            Бичиг баримт баталгаажуулах
          </Button>
        </form>
      )}

      {order.registrantVerified && (
        <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          Бүртгэлийн бичиг баримт баталгаажсан
        </p>
      )}

      {order.status === "PENDING_PAYMENT" && !order.paymentCompleted && (
        <form action={adminMarkOrderPaid} className="rounded-2xl border border-white/10 bg-card p-5 space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <h3 className="font-semibold">Төлбөр баталгаажуулах</h3>
          <p className="text-sm text-muted-foreground">
            Банкны шилжүүлэг эсвэл гараар төлбөр хүлээн авсан бол баталгаажуулна уу.
            {order.paymentMethod === "BANK_TRANSFER" ? " (Банкны шилжүүлэг)" : ""}
          </p>
          <div className="space-y-2">
            <Label htmlFor="transactionId">Гүйлгээний дугаар (заавал биш)</Label>
            <Input id="transactionId" name="transactionId" placeholder="Жишээ: TXN123456" />
          </div>
          <Button type="submit" variant="gradient">
            Төлбөр төлөгдсөн гэж тэмдэглэх
          </Button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {transitions.map((target) => {
          if (target === "REFUNDED" && !canManage) return null;
          const isComplete = target === "COMPLETED";
          const disabled = isComplete && !order.registrantVerified;

          if (isComplete) {
            return (
              <form key={target} action={updateDomainOrderStatus} className="w-full space-y-4 rounded-2xl border border-white/10 bg-card p-5">
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value={target} />
                <h3 className="font-semibold">{DOMAIN_ORDER_ACTION_LABELS[target]}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registrarName">Registrar</Label>
                    <Input
                      id="registrarName"
                      name="registrarName"
                      defaultValue={order.registrarName ?? "registry.mn"}
                      placeholder="registry.mn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrarOrderId">Registrar захиалгын дугаар</Label>
                    <Input
                      id="registrarOrderId"
                      name="registrarOrderId"
                      defaultValue={order.registrarOrderId ?? ""}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="domainExpiresAt">Дуусах огноо</Label>
                    <Input
                      id="domainExpiresAt"
                      name="domainExpiresAt"
                      type="date"
                      defaultValue={
                        order.domainExpiresAt
                          ? order.domainExpiresAt.toISOString().slice(0, 10)
                          : ""
                      }
                    />
                  </div>
                </div>
                <Button type="submit" variant="gradient" disabled={disabled}>
                  {DOMAIN_ORDER_ACTION_LABELS[target]}
                </Button>
                {disabled && (
                  <p className="text-xs text-amber-400">
                    Эхлээд бүртгэлийн бичиг баримтыг баталгаажуулна уу.
                  </p>
                )}
              </form>
            );
          }

          return (
            <form key={target} action={updateDomainOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={target} />
              <Button
                type="submit"
                variant={target === "CANCELLED" || target === "REFUNDED" ? "outline" : "default"}
                className={target === "CANCELLED" || target === "REFUNDED" ? "border-red-500/30 text-red-300" : ""}
              >
                {DOMAIN_ORDER_ACTION_LABELS[target] ?? target}
              </Button>
            </form>
          );
        })}
      </div>

      <form action={saveFulfillmentDetails} className="rounded-2xl border border-white/10 bg-card p-6 space-y-4">
        <input type="hidden" name="id" value={order.id} />
        <h2 className="text-lg font-semibold">Админ тэмдэглэл</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="note-registrar">Registrar</Label>
            <Input id="note-registrar" name="registrarName" defaultValue={order.registrarName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-registrar-id">Registrar ID</Label>
            <Input id="note-registrar-id" name="registrarOrderId" defaultValue={order.registrarOrderId ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note-expires">Дуусах огноо</Label>
            <Input
              id="note-expires"
              name="domainExpiresAt"
              type="date"
              defaultValue={
                order.domainExpiresAt ? order.domainExpiresAt.toISOString().slice(0, 10) : ""
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminNotes">Тэмдэглэл</Label>
          <Textarea id="adminNotes" name="adminNotes" rows={4} defaultValue={order.adminNotes ?? ""} />
        </div>
        <Button type="submit" variant="outline">
          Хадгалах
        </Button>
      </form>
    </div>
  );
}