import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { s3Client, ddbDocClient } from "@/lib/aws-client";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { fileName, fileType, esImagen } = await req.json();

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: "Falta fileName o fileType" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const s3Key = `fotos/${id}-${fileName}`;
  const thumbKey = esImagen ? `thumbs/${id}.jpg` : null;

  // URL firmada para el archivo original
  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      ContentType: fileType,
    }),
    { expiresIn: 300 },
  );

  // URL firmada para el thumbnail (solo si es imagen)
  let thumbUploadUrl: string | null = null;
  if (thumbKey) {
    thumbUploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: thumbKey,
        ContentType: "image/jpeg",
      }),
      { expiresIn: 300 },
    );
  }

  await ddbDocClient.send(
    new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: {
        id,
        s3Key,
        thumbKey,
        tipo: esImagen ? "imagen" : "video",
        uploadedBy: session.user?.email,
        estado: "pendiente",
        fechaSubida: new Date().toISOString(),
      },
    }),
  );

  return NextResponse.json({ uploadUrl, thumbUploadUrl, id, s3Key });
}
