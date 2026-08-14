import { NextResponse } from "next/server";
import { buscarEmitentes, listarEmitentes } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q) return NextResponse.json({ emitentes: buscarEmitentes(q, 50) });
  if (searchParams.get("todos") === "1")
    return NextResponse.json({ emitentes: listarEmitentes() });
  return NextResponse.json({ emitentes: [] });
}
