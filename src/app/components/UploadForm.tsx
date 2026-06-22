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
    <div className="flex flex-col gap-5">
      <label
        htmlFor="file-input"
        className="flex flex-col items-center justify-center gap-3 w-full py-12 border-2 border-dashed border-warm-border rounded-2xl cursor-pointer hover:bg-accent-light transition-colors text-muted-text"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-sm font-medium text-foreground">
          Seleccionar fotos y videos
        </span>
        <span className="text-xs">o arrastra y suelta aquí</span>
        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => handleSeleccion(e.target.files)}
        />
      </label>

      {cola.length > 0 && (
        <>
          <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto border border-warm-border rounded-xl p-3">
            {cola.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-sm py-1.5 px-1"
              >
                <span className="truncate flex-1 text-foreground">
                  {item.file.name}
                </span>

                {item.estado === "esperando" && (
                  <span className="text-xs text-muted-text shrink-0">
                    En cola
                  </span>
                )}
                {item.estado === "subiendo" && (
                  <span className="text-xs text-accent shrink-0">
                    Subiendo...
                  </span>
                )}
                {item.estado === "ok" && (
                  <span className="text-xs text-green-600 shrink-0">
                    Listo
                  </span>
                )}
                {item.estado === "error" && (
                  <span
                    className="text-xs text-red-500 shrink-0"
                    title={item.error}
                  >
                    Error
                  </span>
                )}

                {item.estado !== "subiendo" && (
                  <button
                    onClick={() => quitarDeCola(item.id)}
                    className="text-muted-text hover:text-foreground transition-colors shrink-0 ml-1"
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
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {subiendoTodo ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir {totalPendientes} archivo{totalPendientes !== 1 ? "s" : ""}
              </>
            )}
          </button>

          {totalOk > 0 && (
            <p className="text-sm text-center text-muted-text">
              {totalOk} archivo{totalOk !== 1 ? "s" : ""} subido
              {totalOk !== 1 ? "s" : ""}. Quedará pendiente de aprobación.
            </p>
          )}
        </>
      )}
    </div>
  );
}
