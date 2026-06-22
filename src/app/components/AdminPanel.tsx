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

  if (loading) return <p className="p-8">Cargando fotos...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Panel de administración</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["todas", "pendiente", "aprobada", "rechazada"] as const).map(
          (opcion) => (
            <button
              key={opcion}
              onClick={() => cambiarFiltro(opcion)}
              className={`px-3 py-1 rounded border text-sm ${
                filtro === opcion ? "bg-black text-white" : ""
              }`}
            >
              {opcion} (
              {opcion === "todas"
                ? fotos.length
                : fotos.filter((f) => f.estado === opcion).length}
              )
            </button>
          ),
        )}
        <button
          onClick={cargarFotos}
          className="px-3 py-1 rounded border text-sm ml-auto"
        >
          Refrescar
        </button>
      </div>

      {fotosPagina.length === 0 && (
        <p className="text-gray-500">No hay fotos en este filtro.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotosPagina.map((foto) => (
          <div
            key={foto.id}
            className="border rounded overflow-hidden flex flex-col"
          >
            <button
              onClick={() => setFotoModal(foto)}
              className="w-full h-48 bg-gray-100"
            >
              {foto.tipo === "video" ? (
                <video
                  src={foto.viewUrl}
                  className="w-full h-48 object-cover"
                  preload="metadata"
                  muted
                />
              ) : (
                <img
                  src={foto.thumbUrl ?? foto.viewUrl}
                  alt="Preview"
                  loading="lazy"
                  className="w-full h-48 object-cover"
                />
              )}
            </button>

            <div className="p-3 flex flex-col gap-2">
              <p className="text-xs text-gray-500">{foto.uploadedBy}</p>
              <p className="text-xs text-gray-400">
                {new Date(foto.fechaSubida).toLocaleString("es-CL")}
              </p>
              <span
                className={`text-xs font-semibold w-fit px-2 py-0.5 rounded ${
                  foto.estado === "aprobada"
                    ? "bg-green-100 text-green-700"
                    : foto.estado === "rechazada"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {foto.estado}
              </span>

              <div className="flex gap-2 mt-2 flex-wrap">
                {foto.estado !== "aprobada" && (
                  <button
                    onClick={() => actualizarEstado(foto.id, "aprobada")}
                    className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                  >
                    Aprobar
                  </button>
                )}
                {foto.estado !== "rechazada" && (
                  <button
                    onClick={() => actualizarEstado(foto.id, "rechazada")}
                    className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                  >
                    Rechazar
                  </button>
                )}
                <button
                  onClick={() => eliminarFoto(foto.id)}
                  className="text-xs px-2 py-1 rounded border ml-auto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded overflow-hidden"
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
            <div className="p-3 flex justify-between items-center">
              <p className="text-sm text-gray-600">{fotoModal.uploadedBy}</p>
              <button
                onClick={() => setFotoModal(null)}
                className="px-3 py-1 rounded border text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
