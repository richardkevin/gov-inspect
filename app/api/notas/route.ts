import { type NextRequest, NextResponse } from "next/server";
import {
  contarNotas,
  type FiltrosNotas,
  listarNotas,
  type OrdenacaoNotas,
} from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const pagina = Math.max(1, Number.parseInt(sp.get("pagina") ?? "1", 10) || 1);
  const tamanhoPagina = Math.min(
    100,
    Math.max(10, Number.parseInt(sp.get("tamanhoPagina") ?? "20", 10) || 20),
  );

  const filtros: FiltrosNotas = {
    q: sp.get("q")?.trim() || undefined,
    mes: sp.get("mes")?.trim() || undefined,
    codigoOrgao: sp.get("codigoOrgao")?.trim() || undefined,
    municipio: sp.get("municipio")?.trim() || undefined,
    orgao: sp.get("orgao")?.trim() || undefined,
    valorMin: sp.get("valorMin")?.trim() || undefined,
    valorMax: sp.get("valorMax")?.trim() || undefined,
    dataInicio: sp.get("dataInicio")?.trim() || undefined,
    dataFim: sp.get("dataFim")?.trim() || undefined,
  };

  const campo = sp.get("sortField") as OrdenacaoNotas["campo"];
  const ordenacao: OrdenacaoNotas | undefined = [
    "dataEmissao",
    "valor",
    "municipioEmitente",
    "orgao",
    "orgaoSuperior",
    "razaoSocialEmitente",
    "tipoEvento",
    "chave",
    "mes",
  ].includes(campo)
    ? { campo, direcao: sp.get("sortDir") === "asc" ? "asc" : "desc" }
    : undefined;

  const total = contarNotas(filtros);
  const notas = listarNotas(filtros, {
    limite: tamanhoPagina,
    offset: (pagina - 1) * tamanhoPagina,
    ordenacao,
  });

  return NextResponse.json({ notas, total, pagina, tamanhoPagina });
}
