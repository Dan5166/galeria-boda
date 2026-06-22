import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero */}
      <div className="relative flex py-20 justify-center h-[65vh] bg-accent-light">
        <Image
          src="/hero.jpg"
          alt="Dominic & Danyael"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/70" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center text-white px-6">
          <p className="text-lg uppercase tracking-[0.35em] [text-shadow:_0_1px_8px_rgba(0,0,0,0.9)]">
            19 · 04 · 2026
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight [text-shadow:_0_2px_16px_rgba(0,0,0,0.8)]">
            Dominic &amp; Danyael
          </h1>
          <div className="w-16 h-px bg-white opacity-50 mt-1" />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col items-center text-center px-6 py-14 gap-7">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Gracias por ser parte de este día
          </h2>
          <p className="text-sm max-w-sm leading-relaxed text-muted-text">
            Aquí puedes subir tus fotos y videos, y ver los recuerdos que
            compartieron todos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/upload"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Subir fotos y videos
          </Link>
          <Link
            href="/galeria"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-warm-border text-foreground font-medium text-sm hover:bg-accent-light transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Ver la galería
          </Link>
        </div>

        <p className="text-xs italic text-muted-text max-w-sm">
          "Y si alguno prevaleciere contra uno, dos le resistirán; y cordón de
          tres dobleces no se rompe pronto."
        </p>
        <p className="text-xs text-muted-text opacity-60">Eclesiastés 4:12</p>
      </div>
    </main>
  );
}
