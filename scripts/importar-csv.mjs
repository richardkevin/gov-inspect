import { createReadStream, mkdirSync, readdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { Transform } from "node:stream";
import Database from "better-sqlite3";

const DIR_CSV = "data/csv";
const DB_PATH = "data/db/notas.db";

mkdirSync("data/db", { recursive: true });

const NOTA_COLS = {
  chave: "CHAVE DE ACESSO",
  modelo: "MODELO",
  serie: "SÉRIE",
  numero: "NÚMERO",
  natureza: "NATUREZA DA OPERAÇÃO",
  dataEmissao: "DATA EMISSÃO",
  tipoEvento: "EVENTO MAIS RECENTE",
  dataEvento: "DATA/HORA EVENTO MAIS RECENTE",
  cpfCnpjEmitente: "CPF/CNPJ Emitente",
  razaoSocial: "RAZÃO SOCIAL EMITENTE",
  inscricaoEstadual: "INSCRIÇÃO ESTADUAL EMITENTE",
  ufEmitente: "UF EMITENTE",
  municipioEmitente: "MUNICÍPIO EMITENTE",
  codigoOrgaoSuperior: "CÓDIGO ÓRGÃO SUPERIOR DESTINATÁRIO",
  orgaoSuperior: "ÓRGÃO SUPERIOR DESTINATÁRIO",
  codigoOrgao: "CÓDIGO ÓRGÃO DESTINATÁRIO",
  orgao: "ÓRGÃO DESTINATÁRIO",
  cnpjDestinatario: "CNPJ DESTINATÁRIO",
  nomeDestinatario: "NOME DESTINATÁRIO",
  ufDestinatario: "UF DESTINATÁRIO",
  indicadorIE: "INDICADOR IE DESTINATÁRIO",
  destinoOperacao: "DESTINO DA OPERAÇÃO",
  consumidorFinal: "CONSUMIDOR FINAL",
  presencaComprador: "PRESENÇA DO COMPRADOR",
  valor: "VALOR NOTA FISCAL",
};

const ITEM_COLS = {
  numeroProduto: "NÚMERO PRODUTO",
  descricao: "DESCRIÇÃO DO PRODUTO/SERVIÇO",
  codigoNcm: "CÓDIGO NCM/SH",
  ncmTipo: "NCM/SH (TIPO DE PRODUTO)",
  cfop: "CFOP",
  quantidade: "QUANTIDADE",
  unidade: "UNIDADE",
  valorUnitario: "VALOR UNITÁRIO",
  valorTotal: "VALOR TOTAL",
};

const decoder = new TextDecoder("iso-8859-1");

function toText(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === "-1" || s === "Sem informação") return null;
  return s;
}

function toNumber(value) {
  if (value == null) return null;
  let s = String(value).trim().replace(/\s/g, "");
  if (!s || s === "-1" || s === "Sem informação") return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toInteger(value) {
  const n = toNumber(value);
  return n === null ? null : Math.round(n);
}

function toDataIso(value) {
  const s = toText(value);
  if (!s) return null;
  const m = s.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!m) return s;
  const [, dd, mm, yyyy, hh = "00", min = "00", ss = "00"] = m;
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function parseCSVLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ";") {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function indexByHeader(headerLine) {
  const map = new Map();
  parseCSVLine(headerLine)
    .map((h) => h.trim())
    .forEach((h, i) => {
      map.set(h, i);
    });
  return map;
}

async function lerLinhas(arquivo, aoHeader, aoProcessar) {
  const input = createReadStream(arquivo).pipe(
    new Transform({
      transform(chunk, _enc, cb) {
        cb(null, decoder.decode(chunk, { stream: true }));
      },
    }),
  );
  const rl = createInterface({ input, crlfDelay: Infinity });
  let primeira = true;
  let contagem = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (primeira) {
      primeira = false;
      aoHeader(
        parseCSVLine(line)
          .map((h) => h.trim())
          .join(";"),
      );
      continue;
    }
    aoProcessar(parseCSVLine(line));
    contagem++;
    if (contagem % 100000 === 0) process.stdout.write(`  ${contagem}...`);
  }
  return contagem;
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = OFF");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  DROP TABLE IF EXISTS item_nota;
  DROP TABLE IF EXISTS nota;

  CREATE TABLE nota (
    chave TEXT PRIMARY KEY,
    modelo TEXT,
    serie TEXT,
    numero INTEGER,
    natureza TEXT,
    data_emissao TEXT,
    tipo_evento TEXT,
    data_evento TEXT,
    cpf_cnpj_emitente TEXT,
    razao_social_emitente TEXT,
    inscricao_estadual_emitente TEXT,
    uf_emitente TEXT,
    municipio_emitente TEXT,
    codigo_orgao_superior TEXT,
    orgao_superior TEXT,
    codigo_orgao TEXT,
    orgao TEXT,
    cnpj_destinatario TEXT,
    nome_destinatario TEXT,
    uf_destinatario TEXT,
    indicador_ie TEXT,
    destino_operacao TEXT,
    consumidor_final TEXT,
    presenca_comprador TEXT,
    valor REAL,
    mes TEXT
  );

  CREATE INDEX idx_nota_mes ON nota (mes);
  CREATE INDEX idx_nota_data_emissao ON nota (data_emissao);
  CREATE INDEX idx_nota_valor ON nota (valor);
  CREATE INDEX idx_nota_codigo_orgao ON nota (codigo_orgao);
  CREATE INDEX idx_nota_razao_social ON nota (razao_social_emitente);

  CREATE TABLE item_nota (
    chave TEXT NOT NULL,
    numero_produto TEXT,
    descricao TEXT,
    codigo_ncm TEXT,
    ncm_tipo TEXT,
    cfop TEXT,
    quantidade REAL,
    unidade TEXT,
    valor_unitario REAL,
    valor_total REAL,
    PRIMARY KEY (chave, numero_produto)
  );

  CREATE INDEX idx_item_chave ON item_nota (chave);
`);

const insertNota = db.prepare(`
  INSERT INTO nota (
    chave, modelo, serie, numero, natureza, data_emissao, tipo_evento, data_evento,
    cpf_cnpj_emitente, razao_social_emitente, inscricao_estadual_emitente,
    uf_emitente, municipio_emitente, codigo_orgao_superior, orgao_superior,
    codigo_orgao, orgao, cnpj_destinatario, nome_destinatario, uf_destinatario,
    indicador_ie, destino_operacao, consumidor_final, presenca_comprador,
    valor, mes
  ) VALUES (
    @chave, @modelo, @serie, @numero, @natureza, @dataEmissao, @tipoEvento, @dataEvento,
    @cpfCnpjEmitente, @razaoSocial, @inscricaoEstadual, @ufEmitente, @municipioEmitente,
    @codigoOrgaoSuperior, @orgaoSuperior, @codigoOrgao, @orgao, @cnpjDestinatario,
    @nomeDestinatario, @ufDestinatario, @indicadorIE, @destinoOperacao,
    @consumidorFinal, @presencaComprador, @valor, @mes
  )
  ON CONFLICT(chave) DO NOTHING
`);

const insertItem = db.prepare(`
  INSERT INTO item_nota (
    chave, numero_produto, descricao, codigo_ncm, ncm_tipo, cfop, quantidade,
    unidade, valor_unitario, valor_total
  ) VALUES (
    @chave, @numeroProduto, @descricao, @codigoNcm, @ncmTipo, @cfop, @quantidade,
    @unidade, @valorUnitario, @valorTotal
  )
  ON CONFLICT(chave, numero_produto) DO NOTHING
`);

function extrair(campos, mapa, cols) {
  const row = {};
  for (const [chave, header] of Object.entries(cols)) {
    const idx = mapa.get(header);
    row[chave] = idx === undefined ? null : campos[idx];
  }
  return row;
}

async function importarMes(periodo) {
  const dir = `${DIR_CSV}/${periodo}`;
  const arquivos = readdirSync(dir).filter((f) => f.endsWith(".csv"));
  const arquivoNota = arquivos.find(
    (f) => f.includes("NotaFiscal.csv") && !f.includes("Item"),
  );
  const arquivoItem = arquivos.find((f) => f.includes("NotaFiscalItem.csv"));
  if (!arquivoNota || !arquivoItem) {
    console.warn(`  Aviso: ${periodo} sem arquivos completos, pulando.`);
    return;
  }

  const mes = `${periodo.slice(0, 4)}-${periodo.slice(4)}`;

  let mapa = null;
  let contagemNotas = 0;
  const tx = db.transaction((rows) => {
    for (const campos of rows) {
      const r = extrair(campos, mapa, NOTA_COLS);
      insertNota.run({
        chave: toText(r.chave),
        modelo: toText(r.modelo),
        serie: toText(r.serie),
        numero: toInteger(r.numero),
        natureza: toText(r.natureza),
        dataEmissao: toDataIso(r.dataEmissao),
        tipoEvento: toText(r.tipoEvento),
        dataEvento: toDataIso(r.dataEvento),
        cpfCnpjEmitente: toText(r.cpfCnpjEmitente),
        razaoSocial: toText(r.razaoSocial),
        inscricaoEstadual: toText(r.inscricaoEstadual),
        ufEmitente: toText(r.ufEmitente),
        municipioEmitente: toText(r.municipioEmitente),
        codigoOrgaoSuperior: toText(r.codigoOrgaoSuperior),
        orgaoSuperior: toText(r.orgaoSuperior),
        codigoOrgao: toText(r.codigoOrgao),
        orgao: toText(r.orgao),
        cnpjDestinatario: toText(r.cnpjDestinatario),
        nomeDestinatario: toText(r.nomeDestinatario),
        ufDestinatario: toText(r.ufDestinatario),
        indicadorIE: toText(r.indicadorIE),
        destinoOperacao: toText(r.destinoOperacao),
        consumidorFinal: toText(r.consumidorFinal),
        presencaComprador: toText(r.presencaComprador),
        valor: toNumber(r.valor),
        mes,
      });
      contagemNotas++;
    }
  });

  console.log(`Importando notas ${periodo}...`);
  let buffer = [];
  await lerLinhas(
    `${dir}/${arquivoNota}`,
    (headerLine) => {
      mapa = indexByHeader(headerLine);
    },
    (campos) => {
      buffer.push(campos);
      if (buffer.length >= 5000) {
        tx(buffer);
        buffer = [];
      }
    },
  );
  if (buffer.length) tx(buffer);
  console.log(`\n  Notas: ${contagemNotas}`);

  let mapaItem = null;
  let contagemItens = 0;
  const txItem = db.transaction((rows) => {
    for (const campos of rows) {
      const r = extrair(campos, mapaItem, ITEM_COLS);
      insertItem.run({
        chave: toText(campos[0]),
        numeroProduto: toText(r.numeroProduto),
        descricao: toText(r.descricao),
        codigoNcm: toText(r.codigoNcm),
        ncmTipo: toText(r.ncmTipo),
        cfop: toText(r.cfop),
        quantidade: toNumber(r.quantidade),
        unidade: toText(r.unidade),
        valorUnitario: toNumber(r.valorUnitario),
        valorTotal: toNumber(r.valorTotal),
      });
      contagemItens++;
    }
  });

  console.log(`Importando itens ${periodo}...`);
  buffer = [];
  await lerLinhas(
    `${dir}/${arquivoItem}`,
    (headerLine) => {
      mapaItem = indexByHeader(headerLine);
    },
    (campos) => {
      buffer.push(campos);
      if (buffer.length >= 5000) {
        txItem(buffer);
        buffer = [];
      }
    },
  );
  if (buffer.length) txItem(buffer);
  console.log(`\n  Itens: ${contagemItens}`);
}

const periodos = readdirSync(DIR_CSV)
  .filter((d) => /^2026\d{2}$/.test(d))
  .sort();

for (const periodo of periodos) {
  await importarMes(periodo);
}

const totalNotas = db.prepare("SELECT COUNT(*) AS n FROM nota").get().n;
const totalItens = db.prepare("SELECT COUNT(*) AS n FROM item_nota").get().n;
const porMes = db
  .prepare("SELECT mes, COUNT(*) AS n FROM nota GROUP BY mes ORDER BY mes")
  .all();
console.log("\nResumo:");
console.table(porMes);
console.log(`Total de notas: ${totalNotas} | Total de itens: ${totalItens}`);

db.close();
