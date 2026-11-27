import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { studioSession } from "../../../../lib/studio-session";
import { safeCallbackUrl, signinView } from "../../../../lib/signin";
import { SigninForm } from "../../../../components/studio/signin-form";
import { SignoutButton } from "../../../../components/studio/signout-button";

export const metadata: Metadata = {
  title: "Нэвтрэх",
};

/**
 * Редакцын нэвтрэх хуудас — студийн ЦОРЫН НЭГ хаалгагүй хуудас.
 *
 * `middleware.ts` үүнийг `STUDIO_PUBLIC`-д тооцдог ба `(desk)`-ийн
 * бүрхүүлийн ГАДНА байрлана: эс бөгөөс нэвтрээгүй хүн өөрөө өөр рүүгээ
 * хязгааргүй чиглүүлэгдэнэ.
 *
 * Гурван төлөв бий (`signinView`): форм, студи рүү чиглүүлэх, ба
 * «нэвтэрсэн ч эрхгүй». Гурав дахь нь ТУСДАА байх ёстой — хоосон форм
 * нь буруу нууц үгтэй адил харагдана.
 */
export default async function SigninPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

  const [session, studio] = await Promise.all([getServerSession(authOptions), studioSession()]);
  const view = signinView({ signedIn: Boolean(session?.user?.id), hasStudio: Boolean(studio) });

  if (view === "redirect") redirect(callbackUrl);

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-head text-[30px] font-bold leading-tight tracking-tight">
        Редакцын систем
      </h1>

      {view === "no-access" ? (
        <>
          <p className="mt-2 font-head text-sm text-muted">
            Та <b className="text-ink">{session?.user?.email}</b> хаягаар нэвтэрсэн.
          </p>

          <div className="mt-7 rounded-xl border border-line bg-pan p-5">
            <p className="font-head text-[15px] font-semibold text-ink">
              Танд редакцын эрх алга.
            </p>
            <p className="mt-2 font-head text-sm text-muted">
              Нэвтрэлт нь зөв — зөвхөн эрх олгогдоогүй, эсвэл эрхийг түр хаасан байна.
              Нууц үгээ солих шаардлагагүй. Ерөнхий редактортой холбогдож эрх хүснэ үү.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SignoutButton label="Өөр хаягаар нэвтрэх" />
              <Link
                href="/"
                className="flex h-11 items-center px-2 font-head text-sm font-semibold text-cob underline"
              >
                Сайт руу буцах
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
