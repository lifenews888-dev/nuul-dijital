import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { studioSession } from "../../../../lib/studio-session";
import { safeCallbackUrl } from "../../../../lib/signin";
import { SigninForm } from "../../../../components/studio/signin-form";

export const metadata: Metadata = {
  title: "Нэвтрэх",
};

/**
 * Редакцын нэвтрэх хуудас — студийн ЦОРЫН НЭГ хаалгагүй хуудас.
 *
 * `middleware.ts` үүнийг `STUDIO_PUBLIC`-д тооцдог ба `(desk)`-ийн
 * бүрхүүлийн ГАДНА байрлана: эс бөгөөс нэвтрээгүй хүн өөрөө өөр рүүгээ
 * хязгааргүй чиглүүлэгдэнэ.
 */
export default async function SigninPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

  /** Аль хэдийн нэвтэрсэн БА эрхтэй бол формыг харуулах шаардлагагүй */
  const studio = await studioSession();
  if (studio) redirect(callbackUrl);

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-head text-[30px] font-bold leading-tight tracking-tight">
        Редакцын систем
      </h1>
      <p className="mt-2 font-head text-sm text-muted">
        Парламентын мэдээний редакцад зөвхөн эрх бүхий хүн нэвтэрнэ.
      </p>

      <div className="mt-7 rounded-xl border border-line bg-pan p-5">
        <SigninForm callbackUrl={callbackUrl} />
      </div>

      <p className="mt-6 font-head text-sm text-muted">
        Эрх хүсэх бол ерөнхий редактортой холбогдоно уу.{" "}
        <Link href="/" className="font-semibold text-cob underline">
          Сайт руу буцах
        </Link>
      </p>
    </main>
  );
}
