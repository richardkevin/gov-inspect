import type { ItemRow, NotaRow } from "../../lib/db";

export type LinhaNota = {
  id: string;
  chave: string;
  dataEmissao: string | null;
  municipioEmitente: string | null;
  razaoSocialEmitente: string | null;
  cpfCnpjEmitente: string | null;
  orgao: string | null;
  codigoOrgao: string | null;
  orgaoSuperior: string | null;
  valor: number | null;
  mes: string;
};

export type FiltrosDigitados = {
  q: string;
  meses: string[];
  municipio: string[];
  orgao: string[];
  orgaoSuperior: string[];
  emitente: string[];
};

export type DetalheNota = {
  nota: NotaRow;
  itens: ItemRow[];
};

export type OpcoesVisao = {
  emitentes: string[];
  municipios: string[];
  orgaos: string[];
  orgaosSuperior: string[];
  meses: string[];
};

export const filtrosVazios: FiltrosDigitados = {
  q: "",
  meses: [],
  municipio: [],
  orgao: [],
  orgaoSuperior: [],
  emitente: [],
};

export function toLinha(nota: NotaRow): LinhaNota {
  return {
    id: nota.chave,
    chave: nota.chave,
    dataEmissao: nota.dataEmissao,
    municipioEmitente: nota.municipioEmitente,
    razaoSocialEmitente: nota.razaoSocialEmitente,
    cpfCnpjEmitente: nota.cpfCnpjEmitente,
    orgao: nota.orgao,
    codigoOrgao: nota.codigoOrgao,
    orgaoSuperior: nota.orgaoSuperior,
    valor: nota.valor,
    mes: nota.mes,
  };
}

export const fmtMoeda = (v: number | null): string =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

export const fmtData = (v: string | null): string => {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

export function fmtChave(chave: string): string {
  return `${chave.slice(0, 4)} ${chave.slice(4, 8)} ${chave.slice(8, 12)} ${chave.slice(12, 16)} ${chave.slice(16, 20)} ${chave.slice(20, 24)} ${chave.slice(24, 34)} ${chave.slice(34, 44)}`;
}

export function acumularOpcoes(
  prev: OpcoesVisao,
  novas: OpcoesVisao,
): OpcoesVisao {
  const uniao = (a: string[], b: string[]): string[] =>
    [...new Set([...a, ...b].filter((v) => v !== ""))].sort((x, y) =>
      x.localeCompare(y, "pt-BR"),
    );
  return {
    emitentes: uniao(prev.emitentes, novas.emitentes),
    municipios: uniao(prev.municipios, novas.municipios),
    orgaos: uniao(prev.orgaos, novas.orgaos),
    orgaosSuperior: uniao(prev.orgaosSuperior, novas.orgaosSuperior),
    meses: uniao(prev.meses, novas.meses),
  };
}
