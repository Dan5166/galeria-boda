import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, ddbDocClient } from "@/lib/aws-client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return null;
  }
  return session;
}

// Actualizar estado: aprobada / rechazada / pendiente
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { estado } = await req.json();

  const estadosValidos = ["pendiente", "aprobada", "rechazada"];
  if (!estadosValidos.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: { id },
      UpdateExpression: "SET estado = :estado",
      ExpressionAttributeValues: { ":estado": estado },
    }),
  );

  return NextResponse.json({ success: true, id, estado });
}

// Eliminar foto: borra de S3 y de DynamoDB
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  // 1. Buscar el item para obtener su s3Key
  const result = await ddbDocClient.send(
    new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: { id },
    }),
  );

  if (!result.Item) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  // 2. Borrar de S3 (original y thumbnail si existe)
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: result.Item.s3Key,
    }),
  );

  if (result.Item.thumbKey) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: result.Item.thumbKey,
      }),
    );
  }

  // 3. Borrar de DynamoDB
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: { id },
    }),
  );

  return NextResponse.json({ success: true, id });
}
