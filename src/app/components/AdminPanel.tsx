"use client";

import { useEffect, useState } from "react";

interface Foto {
  id: string;
  s3Key: string;
  thumbKey: string | null;
  tipo: "imagen" | "video";
  uploadedBy: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  fechaSubida: string;
  viewUrl: string;
  thumbUrl: string | null;
}

const POR_PAGINA = 8;

export default function AdminPanel() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | Foto["estado"]>("todas");
  const [pagina, setPagina] = useState(1);
  const [fotoModal, setFotoModal] = useState<Foto | null>(null);

  async function cargarFotos() {
    setLoading(true);
    const res = await fetch("/api/admin/fotos");
    const data = await res.json();
    setFotos(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    cargarFotos();
  }, []);

  async function actualizarEstado(id: string, estado: Foto["estado"]) {
    await fetch(`/api/admin/fotos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, estado } : f)));
  }

  async function eliminarFoto(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esto? No se puede deshacer.")) {
      return;
    }
    await fetch(`/api/admin/fotos/${id}`, { method: "DELETE" });
    setFotos((prev) => prev.filter((f) => f.id !== id));
    if (fotoModal?.id === id) setFotoModal(null);
  }

  const fotosFiltradas =
    filtro === "todas" ? fotos : fotos.filter((f) => f.estado === filtro);

  const totalPaginas = Math.max(
    1,
    Math.ceil(fotosFiltradas.length / POR_PAGINA),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const fotosPagina = fotosFiltradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function cambiarFiltro(nuevo: typeof filtro) {
    setFiltro(nuevo);
    setPagina(1);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-text">Cargando fotos...</p>
      </div>
    );
  }

  const estadoLabel: Record<string, string> = {
    todas: "Todas",
    pendiente: "Pendientes",
    aprobada: "Aprobadas",
    rechazada: "Rechazadas",
  };

  return (
    <div className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Panel de administración
            </h1>
            <p className="mt-1 text-sm text-muted-text">
              {fotos.length} foto{fotos.length !== 1 ? "s" : ""} en total
            </p>
          </div>
          <button
            onClick={cargarFotos}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-warm-border text-sm text-muted-text hover:bg-accent-light transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refrescar
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["todas", "pendiente", "aprobada", "rechazada"] as const).map(
            (opcion) => (
              <button
                key={opcion}
                onClick={() => cambiarFiltro(opcion)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                  filtro === opcion
                    ? "bg-accent text-white border-accent"
                    : "border-warm-border text-muted-text hover:bg-accent-light"
                }`}
              >
                {estadoLabel[opcion]}{" "}
                <span className="opacity-70">
                  (
                  {opcion === "todas"
                    ? fotos.length
                    : fotos.filter((f) => f.estado === opcion).length}
                  )
                </span>
              </button>
            ),
          )}
        </div>

        {fotosPagina.length === 0 && (
          <p className="text-sm text-muted-text py-10 text-center">
            No hay fotos en este filtro.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotosPagina.map((foto) => (
            <div
              key={foto.id}
              className="border border-warm-border rounded-xl overflow-hidden flex flex-col bg-background"
            >
              <button
                onClick={() => setFotoModal(foto)}
                className="w-full h-44 bg-accent-light overflow-hidden"
              >
                {foto.tipo === "video" ? (
                  <video
                    src={foto.viewUrl}
                    className="w-full h-44 object-cover"
                    preload="metadata"
                    muted
                  />
                ) : (
                  <img
                    src={foto.thumbUrl ?? foto.viewUrl}
                    alt="Preview"
                    loading="lazy"
                    className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
                  />
                )}
              </button>

              <div className="p-3 flex flex-col gap-2">
                <p className="text-xs text-muted-text truncate">
                  {foto.uploadedBy}
                </p>
                <p className="text-xs text-muted-text opacity-70">
                  {new Date(foto.fechaSubida).toLocaleString("es-CL")}
                </p>
                <span
                  className={`text-xs font-medium w-fit px-2 py-0.5 rounded-full ${
                    foto.estado === "aprobada"
                      ? "bg-green-100 text-green-700"
                      : foto.estado === "rechazada"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {estadoLabel[foto.estado] ?? foto.estado}
                </span>

                <div className="flex gap-2 mt-1 flex-wrap">
                  {foto.estado !== "aprobada" && (
                    <button
                      onClick={() => actualizarEstado(foto.id, "aprobada")}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-600 text-white hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Aprobar
                    </button>
                  )}
                  {foto.estado !== "rechazada" && (
                    <button
                      onClick={() => actualizarEstado(foto.id, "rechazada")}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500 text-white hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Rechazar
                    </button>
                  )}
                  <button
                    onClick={() => eliminarFoto(foto.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-warm-border text-muted-text hover:bg-accent-light transition-colors ml-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

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
              <p className="text-sm text-muted-text">{fotoModal.uploadedBy}</p>
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
