import UploadForm from "@/app/components/UploadForm";

export default function UploadPage() {
  return (
    <main className="flex-1 px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sube tus recuerdos
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            Comparte tus fotos y videos de la boda
          </p>
        </div>
        <UploadForm />
      </div>
    </main>
  );
}
