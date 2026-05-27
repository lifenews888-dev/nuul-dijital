"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Plus, Edit2, Trash2, Loader2, X, ImageOff, ExternalLink } from "lucide-react";
import ImageUpload from "@/components/editor/ImageUpload";

type Status = "LIVE" | "SOON" | "DRAFT";

const GRADIENTS = [
  { label: "Violet", value: "from-[#7B6FFF]/30 via-[#7B6FFF]/10 to-transparent" },
  { label: "Teal",   value: "from-[#00E5B8]/30 via-[#00E5B8]/10 to-transparent" },
  { label: "Amber",  value: "from-[#FFB02E]/25 via-[#FFB02E]/08 to-transparent" },
  { label: "Pink",   value: "from-[#FF6B9D]/25 via-[#FF6B9D]/08 to-transparent" },
  { label: "Blue",   value: "from-[#5BA5FF]/25 via-[#5BA5FF]/08 to-transparent" },
  { label: "Subtle", value: "from-white/15 via-white/5 to-transparent" },
];

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "LIVE",  label: "Live",        color: "bg-emerald-400/15 text-emerald-400" },
  { value: "SOON",  label: "Тун удахгүй", color: "bg-yellow-400/15 text-yellow-400" },
  { value: "DRAFT", label: "Ноорог",      color: "bg-white/10 text-white/60" },
];

interface FormState {
  id?: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  link: string;
  status: Status;
  gradient: string;
  order: number;
  isActive: boolean;
}

const emptyForm: FormState = {
  title: "",
  category: "",
  description: "",
  coverImage: "",
  link: "",
  status: "LIVE",
  gradient: GRADIENTS[0].value,
  order: 0,
  isActive: true,
};

export default function AdminPortfolioPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const utils = trpc.useUtils();
  const itemsQuery = trpc.portfolio.adminList.useQuery();

  const onSuccess = () => {
    utils.portfolio.adminList.invalidate();
    setShowForm(false);
    setForm(emptyForm);
  };

  const createMutation = trpc.portfolio.adminCreate.useMutation({ onSuccess });
  const updateMutation = trpc.portfolio.adminUpdate.useMutation({ onSuccess });
  const deleteMutation = trpc.portfolio.adminDelete.useMutation({
    onSuccess: () => utils.portfolio.adminList.invalidate(),
  });
  const seedMutation = trpc.portfolio.adminSeedDefaults.useMutation({
    onSuccess: () => utils.portfolio.adminList.invalidate(),
  });

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: NonNullable<typeof itemsQuery.data>[number]) {
    setForm({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      coverImage: item.coverImage ?? "",
      link: item.link ?? "",
      status: item.status as Status,
      gradient: item.gradient,
      order: item.order,
      isActive: item.isActive,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      coverImage: form.coverImage || null,
      link: form.link || null,
      status: form.status,
      gradient: form.gradient,
      order: form.order,
      isActive: form.isActive,
    };
    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const items = itemsQuery.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold tracking-tight text-white">
            Бүтээлийн жагсаалт
          </h1>
          <p className="mt-1 text-[13px] text-txt-3">
            Нүүр хуудсанд харагдах "Хийсэн ажлууд" хэсгийг удирдана уу
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="rounded-lg border border-white/10 px-3.5 py-2 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {seedMutation.isPending ? "Үүсгэж байна..." : "Жишээ оруулах"}
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-gray-100"
          >
            <Plus size={15} />
            Шинэ бүтээл
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.04] bg-bg-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04] text-left text-[11px] font-semibold uppercase tracking-wider text-txt-3">
              <th className="px-5 py-3">Бүтээл</th>
              <th className="px-5 py-3">Категори</th>
              <th className="px-5 py-3">Төлөв</th>
              <th className="px-5 py-3">Дараалал</th>
              <th className="px-5 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {itemsQuery.isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-txt-3">
                  <Loader2 size={20} className="mx-auto animate-spin" />
                </td>
              </tr>
            )}

            {!itemsQuery.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-txt-3">
                    <ImageOff size={28} />
                    <p className="text-[13px]">Одоогоор бүртгэлтэй бүтээл алга</p>
                    <p className="text-[11px]">"Шинэ бүтээл" эсвэл "Жишээ оруулах" товч дарж эхлүүлээрэй.</p>
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => {
              const statusBadge = STATUS_OPTIONS.find((s) => s.value === item.status);
              return (
                <tr key={item.id} className="border-b border-white/[0.02] text-[13px] hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md ${item.coverImage ? "" : `bg-gradient-to-br ${item.gradient}`}`}>
                        {item.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                            {item.title.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          {item.title}
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                        <div className="mt-0.5 line-clamp-1 max-w-[420px] text-[12px] text-txt-3">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-txt-2">{item.category}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusBadge?.color ?? "bg-white/10 text-white/60"}`}>
                      {statusBadge?.label ?? item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-txt-2">{item.order}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="mr-1 rounded-md p-1.5 text-txt-3 hover:bg-white/5 hover:text-white"
                      title="Засах"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.title}"-ийг устгах уу?`)) {
                          deleteMutation.mutate({ id: item.id });
                        }
                      }}
                      className="rounded-md p-1.5 text-txt-3 hover:bg-red-500/10 hover:text-red-400"
                      title="Устгах"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-bg-2 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-syne text-lg font-bold text-white">
                {form.id ? "Бүтээл засах" : "Шинэ бүтээл нэмэх"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md p-1.5 text-txt-3 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-txt-2">Гарчиг *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-txt-2">Категори *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="AI Чатбот платформ"
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-txt-2">Тайлбар *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                />
              </div>

              <ImageUpload
                label="Cover зураг (16:10 харьцаатай, ~1200×750)"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
              />
              <p className="-mt-2 text-[11px] text-txt-3">
                Хоосон үлдээвэл доорх gradient-ыг placeholder болгож ашиглана.
              </p>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-txt-2">Холбоос (заавал биш)</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://example.com эсвэл /path"
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-txt-2">Төлөв</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-txt-2">Дараалал</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-3 py-2 text-[13px] text-white outline-none focus:border-v/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-txt-2">Идэвхтэй</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-full rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                      form.isActive
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                        : "border-white/[0.06] bg-bg-3 text-txt-3"
                    }`}
                  >
                    {form.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium text-txt-2">
                  Placeholder gradient (cover зурагтай үед хэрэгсэхгүй)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm({ ...form, gradient: g.value })}
                      className={`relative h-12 overflow-hidden rounded-lg border bg-gradient-to-br ${g.value} ${
                        form.gradient === g.value ? "border-white/60" : "border-white/[0.06]"
                      }`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white/80">
                        {g.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/[0.04] pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-white/70 hover:bg-white/5"
              >
                Болих
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title || !form.category || !form.description}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {form.id ? "Хадгалах" : "Үүсгэх"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
