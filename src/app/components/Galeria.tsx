"use client";

import { useEffect, useRef, useState } from "react";

interface Foto {
  id: string;
  s3Key: string;
  thumbKey: string | null;
  tipo: "imagen" | "video";
  uploadedBy: string;
  fechaSubida: string;
  viewUrl: string;
  thumbUrl: string | null;
}

const POR_PAGINA = 12;

function descargarArchivo(id: string, tipo: string) {
  const ext = tipo === "video" ? "mp4" : "jpg";
  const a = document.createElement("a");
  a.href = `/api/download/${id}`;
  a.download = `boda-${id}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function Galeria() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [fotoModal, setFotoModal] = useState<Foto | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  function cargarFotos() {
    setLoading(true);
    fetch("/api/galeria")
      .then((res) => res.json())
      .then((data) => setFotos(data.items ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    cargarFotos();
  }, []);

  function handleRefresh() {
    cargarFotos();
    setCooldown(10);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );

  function toggleSeleccion(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function salirModoSeleccion() {
    setModoSeleccion(false);
    setSeleccionadas(new Set());
  }

  function descargarSeleccionadas() {
    const elegidas = fotos.filter((f) => seleccionadas.has(f.id));
    elegidas.forEach((foto, i) => {
      setTimeout(() => descargarArchivo(foto.id, foto.tipo), i * 300);
    });
  }

  const totalPaginas = Math.max(1, Math.ceil(fotos.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const fotosPagina = fotos.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-text">Cargando galería...</p>
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-lg font-medium text-foreground">
          Aún no hay fotos aprobadas
        </p>
        <p className="text-sm text-muted-text">¡Vuelve más tarde!</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Galería de la boda
            </h1>
            <p className="mt-1 text-sm text-muted-text">
              {fotos.length} recuerdo{fotos.length !== 1 ? "s" : ""} compartido
              {fotos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {modoSeleccion ? (
              <button
                onClick={salirModoSeleccion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
            ) : (
              <button
                onClick={() => setModoSeleccion(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>
                Seleccionar
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={cooldown > 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {cooldown > 0 ? `${cooldown}s` : "Actualizar"}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotosPagina.map((foto) => {
            const estaSeleccionada = seleccionadas.has(foto.id);
            return (
              <button
                key={foto.id}
                onClick={() =>
                  modoSeleccion ? toggleSeleccion(foto.id) : setFotoModal(foto)
                }
                className={`group aspect-square bg-accent-light rounded-xl overflow-hidden relative transition-all ${
                  estaSeleccionada ? "ring-2 ring-accent ring-offset-2" : ""
                }`}
              >
                {foto.tipo === "video" ? (
                  <video
                    src={foto.viewUrl}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    preload="metadata"
                    muted
                  />
                ) : (
                  <img
                    src={foto.thumbUrl ?? foto.viewUrl}
                    alt="Foto de la boda"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {foto.tipo === "video" && !modoSeleccion && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                )}
                {modoSeleccion && (
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    estaSeleccionada
                      ? "bg-accent border-accent"
                      : "bg-white/70 border-white"
                  }`}>
                    {estaSeleccionada && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Barra de descarga múltiple */}
        {modoSeleccion && seleccionadas.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={descargarSeleccionadas}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-medium text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar {seleccionadas.size} archivo{seleccionadas.size !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Anterior
            </button>
            <span className="text-sm text-muted-text">
              {paginaActual} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors disabled:opacity-40"
            >
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="max-w-3xl w-full bg-background rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {fotoModal.tipo === "video" ? (
              <video
                src={fotoModal.viewUrl}
                controls
                autoPlay
                className="w-full max-h-[80vh]"
              />
            ) : (
              <img
                src={fotoModal.viewUrl}
                alt="Foto completa"
                className="w-full max-h-[80vh] object-contain"
              />
            )}
            <div className="px-4 py-3 flex justify-between items-center border-t border-warm-border">
              <button
                onClick={() => descargarArchivo(fotoModal.id, fotoModal.tipo)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-sm hover:opacity-90 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar
              </button>
              <button
                onClick={() => setFotoModal(null)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
