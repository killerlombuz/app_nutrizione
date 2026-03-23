import { NextResponse } from "next/server";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importExcel } from "@/lib/excel-importer";

export async function POST(request: Request) {
  const professionalId = await requireProfessionalId();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
  }

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Formato file non supportato. Usa .xlsx" },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await importExcel(buffer, professionalId, prisma);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Errore import Excel:", error);
    return NextResponse.json(
      { error: "Errore durante l'importazione del file" },
      { status: 500 }
    );
  }
}
