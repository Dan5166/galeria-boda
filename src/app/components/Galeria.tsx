"use client";

import { useEffect, useState } from "react";

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

export default function Galeria() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [fotoModal, setFotoModal] = useState<Foto | null>(null);

  useEffect(() => {
    fetch("/api/galeria")
      .then((res) => res.json())
      .then((data) => setFotos(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(fotos.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const fotosPagina = fotos.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  if (loading) return <p className="p-8">Cargando galería...</p>;

  if (fotos.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Galería</h1>
        <p className="text-gray-500">
          Todavía no hay fotos aprobadas. ¡Vuelve más tarde!
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Galería de la boda</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotosPagina.map((foto) => (
          <button
            key={foto.id}
            onClick={() => setFotoModal(foto)}
            className="aspect-square bg-gray-100 rounded overflow-hidden"
          >
            {foto.tipo === "video" ? (
              <video
                src={foto.viewUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
            ) : (
              <img
                src={foto.thumbUrl ?? foto.viewUrl}
                alt="Foto de la boda"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}
      </div>

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
            <div className="p-3 flex justify-end">
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
