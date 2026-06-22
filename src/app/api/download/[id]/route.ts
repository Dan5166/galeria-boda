import { NextRequest, NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, ddbDocClient } from "@/lib/aws-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await ddbDocClient.send(
    new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: { id },
    }),
  );

  if (!result.Item) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const foto = result.Item;

  const s3Res = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: foto.s3Key,
    }),
  );

  const ext = foto.tipo === "video" ? "mp4" : "jpg";
  const filename = `boda-${id}.${ext}`;
  const stream = s3Res.Body?.transformToWebStream();

  return new Response(stream, {
    headers: {
      "Content-Type": s3Res.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
