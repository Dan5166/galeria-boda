"use client";

import { useState } from "react";

interface ArchivoEnCola {
  file: File;
  id: string;
  estado: "esperando" | "subiendo" | "ok" | "error";
  error?: string;
}

export default function UploadForm() {
  const [cola, setCola] = useState<ArchivoEnCola[]>([]);
  const [subiendoTodo, setSubiendoTodo] = useState(false);

  function generarThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxWidth = 400;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            blob
              ? resolve(blob)
              : reject(new Error("No se pudo generar thumbnail"));
          },
          "image/jpeg",
          0.6,
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function handleSeleccion(files: FileList | null) {
    if (!files) return;
    const nuevos: ArchivoEnCola[] = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      estado: "esperando",
    }));
    setCola((prev) => [...prev, ...nuevos]);
  }

  function quitarDeCola(id: string) {
    setCola((prev) => prev.filter((item) => item.id !== id));
  }

  function actualizarItem(id: string, cambios: Partial<ArchivoEnCola>) {
    setCola((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...cambios } : item)),
    );
  }

  async function subirArchivo(item: ArchivoEnCola) {
    const { file, id } = item;
    actualizarItem(id, { estado: "subiendo" });

    try {
      const esImagen = file.type.startsWith("image/");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          esImagen,
        }),
      });

      if (!res.ok) throw new Error("No se pudo obtener la URL de subida");

      const { uploadUrl, thumbUploadUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Error subiendo a S3");

      if (esImagen && thumbUploadUrl) {
        const thumbBlob = await generarThumbnail(file);
        const thumbRes = await fetch(thumbUploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbBlob,
        });
        if (!thumbRes.ok) throw new Error("Error subiendo thumbnail");
      }

      actualizarItem(id, { estado: "ok" });
    } catch (err) {
      console.error(err);
      actualizarItem(id, {
        estado: "error",
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  async function subirTodo() {
    setSubiendoTodo(true);
    const pendientes = cola.filter(
      (item) => item.estado === "esperando" || item.estado === "error",
    );

    // Subimos de a 3 en paralelo para no saturar
    const tamanoLote = 3;
    for (let i = 0; i < pendientes.length; i += tamanoLote) {
      const lote = pendientes.slice(i, i + tamanoLote);
      await Promise.all(lote.map((item) => subirArchivo(item)));
    }

    setSubiendoTodo(false);
  }

  const totalPendientes = cola.filter(
    (i) => i.estado === "esperando" || i.estado === "error",
  ).length;
  const totalOk = cola.filter((i) => i.estado === "ok").length;

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleSeleccion(e.target.files)}
      />

      {cola.length > 0 && (
        <>
          <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto border rounded p-2">
            {cola.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate flex-1">{item.file.name}</span>

                {item.estado === "esperando" && (
                  <span className="text-gray-400">En cola</span>
                )}
                {item.estado === "subiendo" && (
                  <span className="text-blue-500">Subiendo...</span>
                )}
                {item.estado === "ok" && (
                  <span className="text-green-600">✓ Listo</span>
                )}
                {item.estado === "error" && (
                  <span className="text-red-600" title={item.error}>
                    Error
                  </span>
                )}

                {item.estado !== "subiendo" && (
                  <button
                    onClick={() => quitarDeCola(item.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={subirTodo}
            disabled={subiendoTodo || totalPendientes === 0}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {subiendoTodo
              ? "Subiendo..."
              : `Subir ${totalPendientes} archivo(s)`}
          </button>

          {totalOk > 0 && (
            <p className="text-green-600 text-sm">
              {totalOk} archivo(s) subido(s). Quedarán pendientes de aprobación.
            </p>
          )}
        </>
      )}
    </div>
  );
}
