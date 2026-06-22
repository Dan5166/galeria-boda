"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-semibold text-lg">
        Galería Boda
      </Link>

      <div className="flex items-center gap-4">
        {status === "loading" && <span className="text-sm">Cargando...</span>}

        {status === "authenticated" && (
          <>
            {(session.user as any)?.role === "admin" && (
              <Link href="/admin" className="text-sm underline">
                Panel admin
              </Link>
            )}
            <Link href="/upload" className="text-sm underline">
              Subir fotos
            </Link>
            <Link href="/galeria" className="text-sm underline">
              Galería
            </Link>
            <span className="text-sm">{session.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm px-3 py-1 rounded border"
            >
              Cerrar sesión
            </button>
          </>
        )}

        {status === "unauthenticated" && (
          <button
            onClick={() => signIn("cognito")}
            className="text-sm px-3 py-1 rounded bg-black text-white"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}
