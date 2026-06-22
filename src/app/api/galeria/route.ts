import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, ddbDocClient } from "@/lib/aws-client";

interface FotoItem {
  id: string;
  s3Key: string;
  thumbKey: string | null;
  tipo: "imagen" | "video";
  uploadedBy: string;
  estado: string;
  fechaSubida: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      FilterExpression: "estado = :estado",
      ExpressionAttributeValues: { ":estado": "aprobada" },
    }),
  );

  const items = (result.Items ?? []) as FotoItem[];

  const itemsWithUrls = await Promise.all(
    items.map(async (item) => {
      const viewUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: item.s3Key,
        }),
        { expiresIn: 3600 },
      );

      const thumbUrl = item.thumbKey
        ? await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: item.thumbKey,
            }),
            { expiresIn: 3600 },
          )
        : null;

      return { ...item, viewUrl, thumbUrl };
    }),
  );

  itemsWithUrls.sort(
    (a, b) =>
      new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime(),
  );

  return NextResponse.json({ items: itemsWithUrls });
}
