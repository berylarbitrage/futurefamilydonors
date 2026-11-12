import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="bg-grain">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center md:py-28">
          <p
            aria-hidden
            className="bg-sun border-ink inline-block -rotate-3 rounded-[18px] border-4 px-6 text-8xl leading-tight font-extrabold tracking-tighter shadow-[8px_8px_0_0_#111] md:text-9xl"
          >
            404
          </p>
          <h1 className="mt-10 text-4xl font-extrabold">Page not found.</h1>
          <p className="mt-4 text-lg font-medium">
            This page doesn&apos;t exist. Or it moved. Either way, let&apos;s get you back.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
