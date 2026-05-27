"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  Crown, Copy, CheckCircle, Loader2, DollarSign, Users,
  TrendingUp, Clock, Banknote, X, ArrowRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const BANKS = [
  { value: "KHAN", label: "Хаан банк" },
  { value: "TDB", label: "ТДБ (Худалдаа хөгжлийн банк)" },
  { value: "GOLOMT", label: "Голомт банк" },
  { value: "KHAS", label: "Хас банк" },
];

export default function ResellerPage() {
  const profile = trpc.reseller.getProfile.useQuery();
  const [companyName, setCompanyName] = useState("");
  const [applying, setApplying] = useState(false);
  const apply = trpc.reseller.applyAsReseller.useMutation();

  async function handleApply() {
    if (!companyName.trim()) return;
    setApplying(true);
    try {
      await apply.mutateAsync({ companyName: companyName.trim() });
      profile.refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setApplying(false);
    }
  }

  if (profile.isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-v" />
      </div>
    );
  }

  // ── No profile → Apply form ──
  if (!profile.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="font-syne text-2xl font-bold tracking-tight text-txt">Reseller болох</h1>
          <p className="mt-1 text-[13px] text-txt-3">nuul.digital-ийн reseller болж орлого олоорой</p>
        </div>

        {/* Benefits */}
        <div className="mb-8 rounded-2xl border border-v/20 bg-gradient-to-br from-bg-2 to-bg-3 p-6">
          <h3 className="mb-4 font-syne text-base font-bold text-txt">Давуу талууд</h3>
          <div className="space-y-3">
            {[
              { icon: DollarSign, text: "20% шимтгэл — борлуулалт бүрээс" },
              { icon: TrendingUp, text: "Дотоод үнээр бүтээгдэхүүн авах боломж" },
              { icon: Users, text: "Зар сурталчилгааны материал, дэмжлэг" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-v/10">
                  <Icon size={16} className="text-v" />
                </div>
                <span className="text-[13px] text-txt-2">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Apply form */}
        <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
          <h3 className="mb-4 font-syne text-base font-bold text-txt">Хүсэлт илгээх</h3>

          <label className="mb-1.5 block text-[12px] font-medium text-txt-3">
            Компанийн нэр
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Таны компани эсвэл бизнесийн нэр"
            className="mb-4 w-full rounded-xl border border-white/[0.06] bg-bg px-4 py-3 text-sm text-txt placeholder:text-txt-3 outline-none transition focus:border-v/30 focus:ring-1 focus:ring-v/20"
          />

          <button
            onClick={handleApply}
            disabled={applying || !companyName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-v py-3 text-[13px] font-bold text-white shadow-[0_0_20px_rgba(108,99,255,0.25)] transition hover:shadow-[0_0_30px_rgba(108,99,255,0.4)] disabled:opacity-50"
          >
            {applying ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Хүсэлт илгээх
          </button>
        </div>
      </div>
    );
  }

  // ── PENDING status ──
  if (profile.data.status === "PENDING") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFB02E]/20">
          <Clock size={32} className="text-[#FFB02E]" />
        </div>
        <h2 className="font-syne text-xl font-bold text-txt">Хүсэлт шалгагдаж байна</h2>
        <p className="mt-2 text-[13px] text-txt-3">
          Таны reseller хүсэлтийг хянаж байна. Баталгаажсан тохиолдолд имэйлээр мэдэгдэнэ.
        </p>
        <div className="mt-4 inline-block rounded-lg bg-[#FFB02E]/10 px-4 py-2 text-[12px] font-medium text-[#FFB02E]">
          Компани: {profile.data.companyName}
        </div>
      </div>
    );
  }

  // ── ACTIVE → Full dashboard ──
  return <ResellerDashboard profileId={profile.data.id} />;
}

// ═══════════════════════════════════════════════════════════════════════
// Reseller Dashboard (active)
// ═══════════════════════════════════════════════════════════════════════

function ResellerDashboard({ profileId }: { profileId: string }) {
  const earnings = trpc.reseller.getEarnings.useQuery();
  const clients = trpc.reseller.getClients.useQuery();
  const referralLink = trpc.reseller.getReferralLink.useQuery();
  const withdrawalHistory = trpc.reseller.getWithdrawalHistory.useQuery();

  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  function copyLink() {
    if (referralLink.data) {
      navigator.clipboard.writeText(referralLink.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const stats = [
    {
      label: "Нийт орлого",
      value: `₮${(earnings.data?.total ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-t/10 text-t",
    },
    {
      label: "Энэ сарын",
      value: `₮${(earnings.data?.balance ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-v/10 text-v",
    },
    {
      label: "Нийт харилцагч",
      value: clients.data?.length ?? 0,
      icon: Users,
      color: "bg-[#FFB02E]/10 text-[#FFB02E]",
    },
    {
      label: "Хүлээгдэж буй",
      value: `₮${(earnings.data?.pending ?? 0).toLocaleString()}`,
      icon: Clock,
      color: "bg-white/[0.06] text-txt-3",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold tracking-tight text-txt">Reseller панел</h1>
          <p className="mt-1 text-[13px] text-txt-3">Орлого, харилцагч, зарлагын удирдлага</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 rounded-xl bg-t px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_0_20px_rgba(0,212,170,0.25)] transition hover:shadow-[0_0_30px_rgba(0,212,170,0.4)]"
        >
          <Banknote size={16} />
          Мөнгө авах
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${s.color.split(" ")[0]}`}>
              <s.icon size={16} className={s.color.split(" ")[1]} />
            </div>
            <div className="font-syne text-xl font-bold text-txt">{s.value}</div>
            <div className="text-[11px] text-txt-3">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link + QR */}
      <div className="mb-6 rounded-2xl border border-v/20 bg-bg-2 p-6">
        <h3 className="mb-4 font-syne text-base font-bold text-txt">Referral холбоос</h3>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* Link + copy */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink.data ?? ""}
                className="flex-1 rounded-xl border border-white/[0.06] bg-bg px-4 py-2.5 text-[13px] text-txt outline-none"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-xl bg-v/10 px-4 py-2.5 text-[12px] font-bold text-v-soft transition hover:bg-v/20"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Хуулсан!" : "Хуулах"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-txt-3">
              Энэ холбоосоор бүртгүүлсэн хэрэглэгчид таны харилцагч болно
            </p>
          </div>

          {/* QR Code */}
          {referralLink.data && (
            <div className="flex-shrink-0 rounded-xl border border-white/[0.06] bg-white p-3">
              <QRCodeSVG value={referralLink.data} size={120} />
            </div>
          )}
        </div>
      </div>

      {/* Clients table */}
      <div className="mb-6 rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
        <h3 className="mb-4 font-syne text-base font-bold text-txt">Харилцагчид</h3>

        {clients.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-bg-3" />
            ))}
          </div>
        ) : !clients.data || clients.data.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-txt-3">Одоогоор харилцагч байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] text-left text-[11px] font-semibold uppercase tracking-wider text-txt-3">
                  <th className="pb-3 pr-4">Нэр</th>
                  <th className="pb-3 pr-4">Имэйл</th>
                  <th className="pb-3 pr-4">Бүртгүүлсэн</th>
                  <th className="pb-3 pr-4">Захиалга</th>
                  <th className="pb-3">Шимтгэл</th>
                </tr>
              </thead>
              <tbody>
                {clients.data.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.02] text-[13px]">
                    <td className="py-3 pr-4 text-txt">{c.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-txt-2">{c.email}</td>
                    <td className="py-3 pr-4 text-txt-3">
                      {new Date(c.joinedAt).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="py-3 pr-4 text-txt-2">{c.orderCount}</td>
                    <td className="py-3 font-medium text-t">20%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
        <h3 className="mb-4 font-syne text-base font-bold text-txt">Зарлагын түүх</h3>

        {withdrawalHistory.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-bg-3" />
            ))}
          </div>
        ) : !withdrawalHistory.data || withdrawalHistory.data.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-txt-3">Зарлагын бичлэг байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] text-left text-[11px] font-semibold uppercase tracking-wider text-txt-3">
                  <th className="pb-3 pr-4">Дүн</th>
                  <th className="pb-3 pr-4">Банк</th>
                  <th className="pb-3 pr-4">Данс</th>
                  <th className="pb-3 pr-4">Төлөв</th>
                  <th className="pb-3">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalHistory.data.map((w) => (
                  <tr key={w.id} className="border-b border-white/[0.02] text-[13px]">
                    <td className="py-3 pr-4 font-semibold text-txt">₮{w.amount.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-txt-2">{w.bankName}</td>
                    <td className="py-3 pr-4 text-txt-3">{w.accountNo}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          w.status === "PAID"
                            ? "bg-t/15 text-t"
                            : w.status === "REJECTED"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-[#FFB02E]/15 text-[#FFB02E]"
                        }`}
                      >
                        {w.status === "PAID" ? "Шилжүүлсэн" : w.status === "REJECTED" ? "Цуцлагдсан" : "Хүлээгдэж буй"}
                      </span>
                    </td>
                    <td className="py-3 text-txt-3">
                      {new Date(w.createdAt).toLocaleDateString("mn-MN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            earnings.refetch();
            withdrawalHistory.refetch();
          }}
          maxAmount={earnings.data?.balance ?? 0}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Withdraw Modal
// ═══════════════════════════════════════════════════════════════════════

function WithdrawModal({
  onClose,
  onSuccess,
  maxAmount,
}: {
  onClose: () => void;
  onSuccess: () => void;
  maxAmount: number;
}) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(BANKS[0].value);
  const [accountNo, setAccountNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestWithdrawal = trpc.reseller.requestWithdrawal.useMutation();

  async function handleSubmit() {
    const num = parseFloat(amount);
    if (!num || num < 10000) {
      alert("Хамгийн бага дүн: ₮10,000");
      return;
    }
    if (!accountNo.trim()) {
      alert("Дансны дугаар оруулна уу");
      return;
    }

    setSubmitting(true);
    try {
      await requestWithdrawal.mutateAsync({
        amount: num,
        bankName: BANKS.find((b) => b.value === bankName)?.label ?? bankName,
        accountNo: accountNo.trim(),
      });
      onSuccess();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-bg-2 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-t/10">
              <Banknote size={16} className="text-t" />
            </div>
            <div>
              <h3 className="font-syne text-base font-bold text-txt">Мөнгө авах</h3>
              <p className="text-[11px] text-txt-3">Боломжит: ₮{maxAmount.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-txt-3 transition hover:bg-white/[0.04] hover:text-txt">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-txt-3">Дүн (₮)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              min={10000}
              max={maxAmount}
              className="w-full rounded-xl border border-white/[0.06] bg-bg px-4 py-3 text-sm text-txt placeholder:text-txt-3 outline-none transition focus:border-v/30 focus:ring-1 focus:ring-v/20"
            />
          </div>

          {/* Bank */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-txt-3">Банк</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-bg px-4 py-3 text-sm text-txt outline-none transition focus:border-v/30 focus:ring-1 focus:ring-v/20"
            >
              {BANKS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account number */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-txt-3">Дансны дугаар</label>
            <input
              type="text"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              placeholder="1234567890"
              className="w-full rounded-xl border border-white/[0.06] bg-bg px-4 py-3 text-sm text-txt placeholder:text-txt-3 outline-none transition focus:border-v/30 focus:ring-1 focus:ring-v/20"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-t py-3 text-[13px] font-bold text-white shadow-[0_0_20px_rgba(0,212,170,0.25)] transition hover:shadow-[0_0_30px_rgba(0,212,170,0.4)] disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
            Хүсэлт илгээх
          </button>
        </div>
      </div>
    </div>
  );
}
