"use client";

import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminMarkServiceOrderPaid,
  saveServiceProvisionDetails,
  updateServiceOrderStatus,
} from "@/app/admin/services/actions";
import {
  DOMAIN_ORDER_TRANSITIONS,
} from "@/lib/domains/order-status";
import { SERVICE_ORDER_ACTION_LABELS } from "@/lib/services/order-status";
import type { DomainOrderStatus, ServiceType } from "@prisma/client";
import { cn } from "@/lib/utils";

type ProvisionDetails = {
  cpanelUrl?: string;
  cpanelUser?: string;
  mailboxCount?: number;
};

type Props = {
  order: {
    id: string;
    status: DomainOrderStatus;
    serviceType: ServiceType;
    adminNotes: string | null;
    provisionDetails: ProvisionDetails | null;
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

export function ServiceOrderFulfillment({ order, canManage }: Props) {
  const transitions = DOMAIN_ORDER_TRANSITIONS[order.status] ?? [];
  const paymentDone =
    order.paymentCompleted || ["PAID", "FULFILLING", "COMPLETED"].includes(order.status);
  const provisioned = order.status === "COMPLETED";
  const details = order.provisionDetails ?? {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Тохируулгын checklist</h2>
        <ul className="space-y-3">
          <CheckItem done={paymentDone} label="Төлбөр баталгаажсан" />
          <CheckItem
            done={["FULFILLING", "COMPLETED"].includes(order.status)}
            label={order.serviceType === "HOSTING" ? "Хостинг тохируулж байна" : "Имэйл тохируулж байна"}
          />
          <CheckItem done={provisioned} label="Үйлчилгээ идэвхжсэн" />
          <CheckItem done={provisioned} label="Хэрэглэгчид мэдэгдсэн" />
        </ul>
      </div>

      {order.status === "PENDING_PAYMENT" && !order.paymentCompleted && (
        <form action={adminMarkServiceOrderPaid} className="rounded-2xl border border-white/10 bg-card p-5 space-y-3">
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

          if (isComplete) {
            return (
              <form
                key={target}
                action={updateServiceOrderStatus}
                className="w-full space-y-4 rounded-2xl border border-white/10 bg-card p-5"
              >
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value={target} />
                <h3 className="font-semibold">{SERVICE_ORDER_ACTION_LABELS[target]}</h3>
                {order.serviceType === "HOSTING" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cpanelUrl">cPanel URL</Label>
                      <Input
                        id="cpanelUrl"
                        name="cpanelUrl"
                        defaultValue={details.cpanelUrl ?? ""}
                        placeholder="https://cpanel.example.mn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpanelUser">cPanel хэрэглэгч</Label>
                      <Input
                        id="cpanelUser"
                        name="cpanelUser"
                        defaultValue={details.cpanelUser ?? ""}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="mailboxCount">Имэйл хайрцгийн тоо</Label>
                    <Input
                      id="mailboxCount"
                      name="mailboxCount"
                      type="number"
                      min={1}
                      defaultValue={details.mailboxCount ?? ""}
                    />
                  </div>
                )}
                <Button type="submit" variant="gradient">
                  {SERVICE_ORDER_ACTION_LABELS[target]}
                </Button>
              </form>
            );
          }

          return (
            <form key={target} action={updateServiceOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={target} />
              <Button
                type="submit"
                variant={target === "CANCELLED" || target === "REFUNDED" ? "outline" : "default"}
                className={
                  target === "CANCELLED" || target === "REFUNDED"
                    ? "border-red-500/30 text-red-300"
                    : ""
                }
              >
                {SERVICE_ORDER_ACTION_LABELS[target] ?? target}
              </Button>
            </form>
          );
        })}
      </div>

      <form
        action={saveServiceProvisionDetails}
        className="rounded-2xl border border-white/10 bg-card p-6 space-y-4"
      >
        <input type="hidden" name="id" value={order.id} />
        <h2 className="text-lg font-semibold">Админ тэмдэглэл</h2>
        {order.serviceType === "HOSTING" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="note-cpanel-url">cPanel URL</Label>
              <Input id="note-cpanel-url" name="cpanelUrl" defaultValue={details.cpanelUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-cpanel-user">cPanel хэрэглэгч</Label>
              <Input id="note-cpanel-user" name="cpanelUser" defaultValue={details.cpanelUser ?? ""} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="note-mailbox-count">Имэйл хайрцгийн тоо</Label>
            <Input
              id="note-mailbox-count"
              name="mailboxCount"
              type="number"
              min={1}
              defaultValue={details.mailboxCount ?? ""}
            />
          </div>
        )}
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