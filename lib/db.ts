import path from "node:path";
import Database from "better-sqlite3";

export type NotaRow = {
  chave: string;
  modelo: string | null;
  serie: string | null;
  numero: number | null;
  natureza: string | null;
  dataEmissao: string | null;
  tipoEvento: string | null;
  dataEvento: string | null;
  cpfCnpjEmitente: string | null;
  razaoSocialEmitente: string | null;
  inscricaoEstadualEmitente: string | null;
  ufEmitente: string | null;
  municipioEmitente: string | null;
  codigoOrgaoSuperior: string | null;
  orgaoSuperior: string | null;
  codigoOrgao: string | null;
  orgao: string | null;
  cnpjDestinatario: string | null;
  nomeDestinatario: string | null;
  ufDestinatario: string | null;
  indicadorIE: string | null;
  destinoOperacao: string | null;
  consumidorFinal: string | null;
  presencaComprador: string | null;
  valor: number | null;
  mes: string;
};

export type ItemRow = {
  chave: string;
  numeroProduto: string | null;
  descricao: string | null;
  codigoNcm: string | null;
  ncmTipo: string | null;
  cfop: string | null;
  quantidade: number | null;
  unidade: string | null;
  valorUnitario: number | null;
  valorTotal: number | null;
};

export type FiltrosNotas = {
  q?: string;
  mes?: string;
  codigoOrgao?: string;
  municipio?: string;
  orgao?: string;
  valorMin?: string;
  valorMax?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type OrdenacaoNotas = {
  campo:
    | "dataEmissao"
    | "valor"
    | "municipioEmitente"
    | "orgao"
    | "orgaoSuperior"
    | "razaoSocialEmitente"
    | "tipoEvento"
    | "chave"
    | "mes";
  direcao: "asc" | "desc";
};

const COLUNAS_ORDENAVEIS: Record<OrdenacaoNotas["campo"], string> = {
  dataEmissao: "data_emissao",
  valor: "valor",
  municipioEmitente: "municipio_emitente",
  orgao: "orgao",
  orgaoSuperior: "orgao_superior",
  razaoSocialEmitente: "razao_social_emitente",
  tipoEvento: "tipo_evento",
  chave: "chave",
  mes: "mes",
};

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), "data", "db", "notas.db"), {
      readonly: true,
    });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function parseValorBrasil(value: string): number | null {
  const s = value.trim().replace(/\./g, "").replace(/,/g, ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_m, letra: string) => letra.toUpperCase());
}

function normalizarLinha<T extends object>(linha: T): T {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(linha)) {
    normalizado[snakeToCamel(chave)] = valor;
  }
  return normalizado as T;
}

function montarWhere(filtros: FiltrosNotas): {
  clausulas: string[];
  parametros: Record<string, string | number>;
} {
  const clausulas: string[] = [];
  const parametros: Record<string, string | number> = {};

  if (filtros.q) {
    const q = `%${escapeLike(filtros.q.trim())}%`;
    clausulas.push(`(
      chave LIKE @q ESCAPE '\\' OR
      razao_social_emitente LIKE @q ESCAPE '\\' OR
      municipio_emitente LIKE @q ESCAPE '\\' OR
      orgao LIKE @q ESCAPE '\\' OR
      nome_destinatario LIKE @q ESCAPE '\\'
    )`);
    parametros.q = q;
  }
  if (filtros.mes) {
    clausulas.push("mes = @mes");
    parametros.mes = filtros.mes;
  }
  if (filtros.codigoOrgao) {
    clausulas.push("codigo_orgao = @codigoOrgao");
    parametros.codigoOrgao = filtros.codigoOrgao.replace(/\D/g, "");
  }
  if (filtros.municipio) {
    clausulas.push("municipio_emitente LIKE @municipio ESCAPE '\\'");
    parametros.municipio = `%${escapeLike(filtros.municipio.trim())}%`;
  }
  if (filtros.orgao) {
    clausulas.push("orgao LIKE @orgao ESCAPE '\\'");
    parametros.orgao = `%${escapeLike(filtros.orgao.trim())}%`;
  }
  if (filtros.valorMin) {
    const valorMin = parseValorBrasil(filtros.valorMin);
    if (valorMin !== null) {
      clausulas.push("valor >= @valorMin");
      parametros.valorMin = valorMin;
    }
  }
  if (filtros.valorMax) {
    const valorMax = parseValorBrasil(filtros.valorMax);
    if (valorMax !== null) {
      clausulas.push("valor <= @valorMax");
      parametros.valorMax = valorMax;
    }
  }
  if (filtros.dataInicio) {
    clausulas.push("data_emissao >= @dataInicio");
    parametros.dataInicio = filtros.dataInicio;
  }
  if (filtros.dataFim) {
    clausulas.push("data_emissao <= @dataFim");
    parametros.dataFim = filtros.dataFim;
  }
  return { clausulas, parametros };
}

export function contarNotas(filtros: FiltrosNotas = {}): number {
  const { clausulas, parametros } = montarWhere(filtros);
  const sql =
    `SELECT COUNT(*) AS total FROM nota` +
    (clausulas.length ? ` WHERE ${clausulas.join(" AND ")}` : "");
  const row = getDb().prepare(sql).get(parametros) as { total: number };
  return row.total;
}

export function listarNotas(
  filtros: FiltrosNotas = {},
  {
    limite,
    offset,
    ordenacao,
  }: {
    limite: number;
    offset: number;
    ordenacao?: OrdenacaoNotas;
  },
): NotaRow[] {
  const { clausulas, parametros } = montarWhere(filtros);
  const coluna = ordenacao
    ? COLUNAS_ORDENAVEIS[ordenacao.campo]
    : "data_emissao";
  const sentido = ordenacao?.direcao === "asc" ? "ASC" : "DESC";
  const sql =
    `SELECT * FROM nota` +
    (clausulas.length ? ` WHERE ${clausulas.join(" AND ")}` : "") +
    ` ORDER BY ${coluna} ${sentido}, chave ASC` +
    ` LIMIT @limite OFFSET @offset`;
  const linhas = getDb()
    .prepare(sql)
    .all({ ...parametros, limite, offset }) as NotaRow[];
  return linhas.map(normalizarLinha);
}

export function buscarNota(chave: string): NotaRow | null {
  const row = getDb()
    .prepare("SELECT * FROM nota WHERE chave = ?")
    .get(chave) as NotaRow | undefined;
  return row ? normalizarLinha(row) : null;
}

export function listarItens(chave: string): ItemRow[] {
  const itens = getDb()
    .prepare("SELECT * FROM item_nota WHERE chave = ? ORDER BY numero_produto")
    .all(chave) as ItemRow[];
  return itens.map(normalizarLinha);
}

let cacheListas: {
  municipios: string[];
  orgaos: string[];
  codigosOrgao: string[];
} | null = null;

export function listarValoresDistintos(): {
  municipios: string[];
  orgaos: string[];
  codigosOrgao: string[];
} {
  if (cacheListas) return cacheListas;
  const db = getDb();
  const distintas = (coluna: string): string[] =>
    (
      db
        .prepare(
          `SELECT DISTINCT ${coluna} AS v FROM nota WHERE ${coluna} IS NOT NULL AND ${coluna} != '' ORDER BY v`,
        )
        .all() as { v: string }[]
    ).map((r) => r.v);
  cacheListas = {
    municipios: distintas("municipio_emitente"),
    orgaos: distintas("orgao"),
    codigosOrgao: distintas("codigo_orgao"),
  };
  return cacheListas;
}

export function resumoNotas(): {
  total: number;
  valorTotal: number | null;
  meses: number;
} {
  const db = getDb();
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM nota").get() as {
    total: number;
  };
  const { soma } = db.prepare("SELECT SUM(valor) AS soma FROM nota").get() as {
    soma: number | null;
  };
  const { n } = db
    .prepare("SELECT COUNT(DISTINCT mes) AS n FROM nota")
    .get() as {
    n: number;
  };
  return { total, valorTotal: soma, meses: n };
}
