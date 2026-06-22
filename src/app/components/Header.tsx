"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-warm-border bg-background">
      <Link
        href="/"
        className="text-base font-semibold tracking-widest uppercase text-accent"
      >
        Galería Boda
      </Link>

      <nav className="flex items-center gap-5">
        <Link
          href="/galeria"
          className="flex items-center gap-1.5 text-sm text-muted-text hover:text-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Galería
        </Link>
        <Link
          href="/upload"
          className="flex items-center gap-1.5 text-sm text-muted-text hover:text-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Subir fotos
        </Link>

        {status === "authenticated" && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-light text-accent hover:bg-accent hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>

            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-52 bg-background border border-warm-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-warm-border">
                  <p className="text-xs text-muted-text">Conectado como</p>
                  <p className="text-sm font-medium text-foreground truncate mt-0.5">
                    {session.user?.email}
                  </p>
                </div>
                {(session.user as any)?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-text hover:bg-accent-light transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Panel admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-text hover:bg-accent-light transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
