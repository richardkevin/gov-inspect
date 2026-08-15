import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buscarNota,
  contarNotas,
  listarNotas,
  opcoesDoRecorte,
  resumoNotas,
} from "./db";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), "nfdbtest-"));
  process.env.NF_DB_PATH = path.join(dir, "notas.db");
  const db = new Database(process.env.NF_DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE nota (
      chave TEXT PRIMARY KEY,
      data_emissao TEXT,
      razao_social_emitente TEXT,
      municipio_emitente TEXT,
      orgao TEXT,
      orgao_superior TEXT,
      codigo_orgao TEXT,
      nome_destinatario TEXT,
      valor REAL,
      mes TEXT
    );
  `);
  const insert = db.prepare(`
    INSERT INTO nota (
      chave, data_emissao, razao_social_emitente, municipio_emitente, orgao,
      orgao_superior, codigo_orgao, nome_destinatario, valor, mes
    ) VALUES (
      @chave, @dataEmissao, @razaoSocialEmitente, @municipioEmitente, @orgao,
      @orgaoSuperior, @codigoOrgao, @nomeDestinatario, @valor, @mes
    )
  `);
  const linhas = [
    {
      chave: "n1",
      dataEmissao: "2026-08-01 10:00:00",
      razaoSocialEmitente: "Empresa A",
      municipioEmitente: "São Paulo",
      orgao: "Órgão X",
      orgaoSuperior: "Ministério da Defesa",
      codigoOrgao: "37001",
      nomeDestinatario: "Exército",
      valor: 100,
      mes: "2026-08",
    },
    {
      chave: "n2",
      dataEmissao: "2026-08-02 10:00:00",
      razaoSocialEmitente: "Empresa B",
      municipioEmitente: "Rio de Janeiro",
      orgao: "Órgão Y",
      orgaoSuperior: "Ministério da Saúde",
      codigoOrgao: "28001",
      nomeDestinatario: "Fiocruz",
      valor: 200,
      mes: "2026-08",
    },
    {
      chave: "n3",
      dataEmissao: "2026-07-31 10:00:00",
      razaoSocialEmitente: "Empresa A",
      municipioEmitente: "São Paulo",
      orgao: "Órgão X",
      orgaoSuperior: "Ministério da Defesa",
      codigoOrgao: "37001",
      nomeDestinatario: "Marinha",
      valor: 50,
      mes: "2026-07",
    },
    {
      chave: "n4",
      dataEmissao: "2026-08-03 10:00:00",
      razaoSocialEmitente: "Empresa C",
      municipioEmitente: "Brasília",
      orgao: "Órgão Z",
      orgaoSuperior: "Ministério da Justiça e Segurança Pública",
      codigoOrgao: "20000",
      nomeDestinatario: "Polícia Federal",
      valor: 1000,
      mes: "2026-08",
    },
    {
      chave: "n5",
      dataEmissao: "2026-06-15 09:00:00",
      razaoSocialEmitente: "100% Company",
      municipioEmitente: "Campinas",
      orgao: "Órgão W",
      orgaoSuperior: "Ministério da Agricultura e Pecuária",
      codigoOrgao: "22001",
      nomeDestinatario: "Embrapa",
      valor: 75,
      mes: "2026-06",
    },
  ];
  for (const linha of linhas) insert.run(linha);
  db.close();
});

afterAll(() => {
  delete process.env.NF_DB_PATH;
  rmSync(dir, { recursive: true, force: true });
});

describe("contarNotas", () => {
  it("conta todas sem filtro", () => {
    expect(contarNotas()).toBe(5);
  });

  it("filtra por mês", () => {
    expect(contarNotas({ mes: ["2026-08"] })).toBe(3);
    expect(contarNotas({ mes: ["2026-08", "2026-07"] })).toBe(4);
  });

  it("combina mês e emitente sem colidir parâmetros IN", () => {
    expect(contarNotas({ mes: ["2026-08"], emitente: ["Empresa A"] })).toBe(1);
  });

  it("combina mês e município", () => {
    expect(
      contarNotas({ mes: ["2026-08"], municipio: ["Rio de Janeiro"] }),
    ).toBe(1);
  });

  it("combina vários filtros ao mesmo tempo", () => {
    expect(
      contarNotas({
        mes: ["2026-07"],
        emitente: ["Empresa A"],
        orgaoSuperior: ["Ministério da Defesa"],
        municipio: ["São Paulo"],
        orgao: ["Órgão X"],
      }),
    ).toBe(1);
  });

  it("filtra por órgão superior, órgão e município sem mês", () => {
    expect(
      contarNotas({
        orgaoSuperior: ["Ministério da Defesa"],
        orgao: ["Órgão X"],
        municipio: ["São Paulo"],
      }),
    ).toBe(2);
  });

  it("filtra por código de órgão com múltiplos valores", () => {
    expect(contarNotas({ codigoOrgao: ["37001", "28001"] })).toBe(3);
  });

  it("filtra por faixa de valor em formato brasileiro", () => {
    expect(contarNotas({ valorMin: "150" })).toBe(2);
    expect(contarNotas({ valorMin: "1.000" })).toBe(1);
    expect(contarNotas({ valorMax: "150" })).toBe(3);
  });

  it("filtra por intervalo de data", () => {
    expect(contarNotas({ dataInicio: "2026-08-02" })).toBe(2);
    expect(contarNotas({ dataFim: "2026-07-31 10:00:00" })).toBe(2);
  });

  it("busca por termo livre", () => {
    expect(contarNotas({ q: "empresa" })).toBe(4);
    expect(contarNotas({ q: "exército" })).toBe(1);
  });

  it("escapa curingas do LIKE na busca", () => {
    expect(contarNotas({ q: "%" })).toBe(1);
    expect(contarNotas({ q: "100%" })).toBe(1);
  });
});

describe("listarNotas", () => {
  it("ordena por data de emissão desc por padrão", () => {
    const notas = listarNotas({}, { limite: 5, offset: 0 });
    expect(notas.map((n) => n.chave)).toEqual(["n4", "n2", "n1", "n3", "n5"]);
  });

  it("aplica limite e offset", () => {
    const notas = listarNotas({}, { limite: 2, offset: 2 });
    expect(notas.map((n) => n.chave)).toEqual(["n1", "n3"]);
  });

  it("ordena por valor crescente", () => {
    const notas = listarNotas(
      {},
      {
        limite: 5,
        offset: 0,
        ordenacao: { campo: "valor", direcao: "asc" },
      },
    );
    expect(notas.map((n) => n.chave)).toEqual(["n3", "n5", "n1", "n2", "n4"]);
  });

  it("converte colunas snake_case para camelCase", () => {
    const [nota] = listarNotas({}, { limite: 1, offset: 0 });
    expect(nota.dataEmissao).toBe("2026-08-03 10:00:00");
    expect(nota.razaoSocialEmitente).toBe("Empresa C");
    expect("data_emissao" in nota).toBe(false);
  });
});

describe("opcoesDoRecorte", () => {
  it("retorna todos os meses distintos ordenados", () => {
    const opcoes = opcoesDoRecorte({}, { limite: 6, offset: 0 });
    expect(opcoes.meses).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("retorna as opções da janela filtrada", () => {
    const opcoes = opcoesDoRecorte(
      { mes: ["2026-08"] },
      { limite: 6, offset: 0 },
    );
    expect(opcoes.emitentes).toEqual(["Empresa A", "Empresa B", "Empresa C"]);
    expect(opcoes.orgaosSuperior).toContain("Ministério da Saúde");
    expect(opcoes.meses).toEqual(["2026-06", "2026-07", "2026-08"]);
  });
});

describe("buscarNota", () => {
  it("retorna a nota pela chave", () => {
    const nota = buscarNota("n1");
    expect(nota?.razaoSocialEmitente).toBe("Empresa A");
  });

  it("retorna null para chave inexistente", () => {
    expect(buscarNota("inexistente")).toBeNull();
  });
});

describe("resumoNotas", () => {
  it("resume total, valor e meses", () => {
    expect(resumoNotas()).toEqual({
      total: 5,
      valorTotal: 1425,
      meses: 3,
    });
  });
});
