import { NextResponse } from "next/server";
import { buscarNota, listarItens } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chave: string }> },
) {
  const { chave } = await params;
  const chaveLimpa = chave.replace(/\D/g, "");
  const nota = buscarNota(chaveLimpa);
  if (!nota) {
    return NextResponse.json(
      { erro: "Nota fiscal não encontrada no banco de dados." },
      { status: 404 },
    );
  }
  const itens = listarItens(chaveLimpa);
  return NextResponse.json({ nota, itens });
}
