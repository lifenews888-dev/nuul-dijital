"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelsTopLeft, Plus, Pencil, Eye, Trash2, Globe, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

const templateOptions = [
  { value: "blank", label: "Хоосон", color: "from-gray-500 to-gray-700" },
  { value: "business", label: "Бизнес", color: "from-v to-v-dark" },
  { value: "shop", label: "Дэлгүүр", color: "from-t to-t-dark" },
  { value: "restaurant", label: "Ресторан", color: "from-[#FFB02E] to-[#FF8C00]" },
  { value: "blog", label: "Блог", color: "from-[#FF6B9D] to-[#FF3366]" },
];

export default function WebsiteBuilderPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [template, setTemplate] = useState("blank");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: websites, isLoading } = trpc.website.getWebsites.useQuery();
  const createMutation = trpc.website.createWebsite.useMutation({
    onSuccess: (data: { id: string }) => {
      setShowModal(false);
      router.push(`/dashboard/website-builder/editor/${data.id}`);
    },
    onError: (err: { message: string }) => setError(err.message),
  });
  const publishMutation = trpc.website.publishWebsite.useMutation({
    onSuccess: () => utils.website.getWebsites.invalidate(),
  });
  const unpublishMutation = trpc.website.unpublishWebsite.useMutation({
    onSuccess: () => utils.website.getWebsites.invalidate(),
  });
  const deleteMutation = trpc.website.deleteWebsite.useMutation({
    onSuccess: () => utils.website.getWebsites.invalidate(),
  });

  const { data: subdomainCheck } = trpc.website.checkSubdomain.useQuery(
    { subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "") },
    { enabled: subdomain.length >= 2 }
  );

  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  const handleCreate = () => {
    setError("");
    if (!name.trim() || !cleanSubdomain) {
      setError("Нэр болон subdomain оруулна уу");
      return;
    }
    createMutation.mutate({ name: name.trim(), subdomain: cleanSubdomain, template });
  };

  const handleDelete = (id: string, siteName: string) => {
    if (confirm(`"${siteName}" вэбсайтыг устгах уу?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getTemplateColor = (t: string) =>
    templateOptions.find((o) => o.value === t)?.color ?? "from-gray-500 to-gray-700";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold tracking-tight text-txt">Вэбсайт Builder</h1>
          <p className="mt-1 text-[13px] text-txt-3">Өөрийн вэбсайтыг үүсгэж, засварлаж, нийтлэх</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setName("");
            setSubdomain("");
            setTemplate("blank");
            setError("");
          }}
          className="flex items-center gap-2 rounded-xl bg-v px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_0_16px_rgba(108,99,255,0.25)] transition-all hover:shadow-[0_0_24px_rgba(108,99,255,0.4)]"
        >
          <Plus size={15} />
          Шинэ вэбсайт
        </button>
      </div>

      {/* Websites grid */}
      <div className="mb-8 rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
        <h3 className="mb-4 font-syne text-base font-bold text-txt">Миний вэбсайтууд</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-v" />
          </div>
        ) : !websites?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PanelsTopLeft size={40} className="mb-3 text-txt-3" />
            <p className="text-[13px] text-txt-3">Вэбсайт байхгүй байна</p>
            <p className="text-[12px] text-txt-3">Шинэ вэбсайт үүсгэж эхлээрэй</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((site) => (
              <div
                key={site.id}
                className="group overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.01] transition-all hover:border-v/10"
              >
                <div className={`h-24 bg-gradient-to-br ${getTemplateColor(site.template)} opacity-20 transition-opacity group-hover:opacity-30`} />
                <div className="p-4">
                  <div className="mb-1 text-[13px] font-semibold text-txt">{site.name}</div>
                  <div className="mb-3 flex items-center gap-2 text-[11px] text-txt-3">
                    <Globe size={11} />
                    {site.subdomain}.nuul.digital
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        site.status === "PUBLISHED"
                          ? "bg-t/15 text-t"
                          : site.status === "UNPUBLISHED"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-white/[0.06] text-txt-3"
                      }`}
                    >
                      {site.status === "PUBLISHED" ? "Нийтлэгдсэн" : site.status === "UNPUBLISHED" ? "Буцаасан" : "Ноорог"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/dashboard/website-builder/editor/${site.id}`)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-txt-2 transition-all hover:bg-white/[0.04] hover:text-txt"
                    >
                      <Pencil size={12} />
                      Засах
                    </button>

                    {site.status === "PUBLISHED" ? (
                      <>
                        <button
                          onClick={() => unpublishMutation.mutate({ id: site.id })}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-yellow-400 transition-all hover:bg-yellow-500/10"
                        >
                          Нийтлэхгүй
                        </button>
                        <a
                          href={`https://${site.subdomain}.nuul.digital`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-t transition-all hover:bg-t/10"
                        >
                          <Eye size={12} />
                          Үзэх
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => publishMutation.mutate({ id: site.id })}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-t transition-all hover:bg-t/10"
                      >
                        Нийтлэх
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(site.id, site.name)}
                      className="ml-auto rounded-lg p-1.5 text-txt-3 transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates showcase */}
      <h3 className="mb-4 font-syne text-base font-bold text-txt">Загварууд</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templateOptions.map((t) => (
          <div
            key={t.value}
            onClick={() => {
              setShowModal(true);
              setTemplate(t.value);
              setName("");
              setSubdomain("");
              setError("");
            }}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.04] bg-bg-2 transition-all hover:border-v/10"
          >
            <div className={`h-36 bg-gradient-to-br ${t.color} opacity-20 transition-opacity group-hover:opacity-30`} />
            <div className="p-4">
              <div className="text-[13px] font-semibold text-txt">{t.label}</div>
              <div className="text-[11px] text-txt-3">Загвар сонгож эхлэх</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-bg-2 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold text-txt">Шинэ вэбсайт</h3>
              <button onClick={() => setShowModal(false)} className="text-txt-3 hover:text-txt">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-[12px] text-red-400">{error}</div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] font-medium text-txt-2">Нэр</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Миний вэбсайт"
                className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-[13px] text-txt outline-none placeholder:text-txt-3 focus:border-v/30"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] font-medium text-txt-2">Subdomain</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="mysite"
                  className="h-10 flex-1 rounded-l-lg border border-r-0 border-white/[0.06] bg-white/[0.02] px-3 text-[13px] text-txt outline-none placeholder:text-txt-3 focus:border-v/30"
                />
                <div className="flex h-10 items-center rounded-r-lg border border-white/[0.06] bg-white/[0.04] px-3 text-[12px] text-txt-3">
                  .nuul.digital
                </div>
              </div>
              {subdomain.length >= 2 && (
                <p className={`mt-1 text-[11px] ${subdomainCheck?.available ? "text-t" : "text-red-400"}`}>
                  {subdomainCheck?.available ? "Боломжтой" : "Аль хэдийн бүртгэлтэй"}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-[12px] font-medium text-txt-2">Загвар</label>
              <div className="grid grid-cols-5 gap-2">
                {templateOptions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={`rounded-lg border p-2 text-center text-[11px] transition-all ${
                      template === t.value
                        ? "border-v/40 bg-v/10 text-v-soft"
                        : "border-white/[0.06] bg-white/[0.02] text-txt-3 hover:border-white/[0.1]"
                    }`}
                  >
                    <div className={`mx-auto mb-1 h-6 w-full rounded bg-gradient-to-br ${t.color} opacity-40`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !name.trim() || !cleanSubdomain}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-v py-2.5 text-[13px] font-bold text-white shadow-[0_0_16px_rgba(108,99,255,0.25)] transition-all hover:shadow-[0_0_24px_rgba(108,99,255,0.4)] disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Үүсгэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
