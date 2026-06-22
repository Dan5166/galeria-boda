"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-warm-border bg-background">
      <Link
        href="/"
        className="text-base font-semibold tracking-widest uppercase text-accent"
      >
        Galería Boda
      </Link>

      <nav className="flex items-center gap-5">
        {status === "loading" && (
          <span className="text-sm text-muted-text">Cargando...</span>
        )}

        {status === "authenticated" && (
          <>
            {(session.user as any)?.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm text-muted-text hover:text-accent transition-colors"
              >
                Admin
              </Link>
            )}
            <Link
              href="/upload"
              className="flex items-center gap-1.5 text-sm text-muted-text hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Subir fotos
            </Link>
            <Link
              href="/galeria"
              className="flex items-center gap-1.5 text-sm text-muted-text hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Galería
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border border-warm-border text-muted-text hover:bg-accent-light transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Salir
            </button>
          </>
        )}

        {status === "unauthenticated" && (
          <button
            onClick={() => signIn("cognito")}
            className="flex items-center gap-1.5 text-sm px-5 py-2 rounded-full bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Iniciar sesión
          </button>
        )}
      </nav>
    </header>
  );
}
