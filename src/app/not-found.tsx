import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/gradient-mesh";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden">
      <GradientMesh />
      <div className="container-wide text-center">
        <div className="text-gradient-accent text-[8rem] font-black leading-none sm:text-[12rem]">
          404
        </div>
        <h1 className="mt-4 text-3xl font-bold">Хуудас олдсонгүй</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна. Нүүр хуудас руу буцаарай.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="gradient">
            <Link href="/">
              <Home className="size-4" /> Нүүр хуудас
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">
              <ArrowLeft className="size-4" /> Холбоо барих
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
