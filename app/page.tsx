import type { Metadata } from "next";
import {
  consultarNotaFiscalPorChave,
  type DetalheNotaFiscal,
  type EventoNotaFiscal,
  formatBRL,
  formatChave,
  formatCnpj,
  formatDate,
  formatDateTime,
  getApiKey,
  type ItemNotaFiscal,
  listarNotasFiscais,
  type NotaFiscal,
  PortalApiError,
} from "../lib/portal-transparencia";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Notas Fiscais — Portal da Transparência",
  description:
    "Consulte as Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal publicadas no Portal da Transparência do Governo Federal.",
};

export const dynamic = "force-dynamic";

const REGISTRO_API_KEY_URL =
  "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email";
const PORTAL_NOTAS_FISCAIS_URL =
  "https://portaldatransparencia.gov.br/notas-fiscais";

type SearchParams = Record<string, string | string[] | undefined>;

type View =
  | { kind: "prompt" }
  | { kind: "list"; notas: NotaFiscal[]; pagina: number }
  | { kind: "detail"; detalhe: DetalheNotaFiscal; chave: string }
  | { kind: "error"; message: string; status?: number; needsKey: boolean };

function getParam(searchParams: SearchParams, name: string): string {
  const value = searchParams[name];
  return typeof value === "string" ? value : "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const chave = getParam(sp, "chave");
  const cnpjEmitente = getParam(sp, "cnpjEmitente");
  const codigoOrgao = getParam(sp, "codigoOrgao");
  const nomeProduto = getParam(sp, "nomeProduto");
  const pagina = Math.max(1, Number.parseInt(getParam(sp, "pagina"), 10) || 1);

  const apiKey = getApiKey();
  const hasFilters = Boolean(
    chave || cnpjEmitente || codigoOrgao || nomeProduto,
  );
  const submitted = hasFilters || pagina > 1;

  let view: View = { kind: "prompt" };

  if (submitted && !apiKey) {
    view = {
      kind: "error",
      needsKey: true,
      message:
        "A variável de ambiente GOV_API_KEY não está configurada. Ela é necessária para consultar a API de dados do Portal da Transparência.",
    };
  } else if (submitted) {
    try {
      if (chave) {
        const detalhe = await consultarNotaFiscalPorChave(chave, apiKey);
        view = { kind: "detail", detalhe, chave };
      } else {
        const notas = await listarNotasFiscais(
          { pagina, cnpjEmitente, codigoOrgao, nomeProduto },
          apiKey,
        );
        view = { kind: "list", notas, pagina };
      }
    } catch (error) {
      view = {
        kind: "error",
        needsKey: error instanceof PortalApiError && error.status === 401,
        status: error instanceof PortalApiError ? error.status : undefined,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao consultar o Portal da Transparência.",
      };
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>
            Portal da Transparência do Governo Federal
          </span>
          <h1>Notas Fiscais</h1>
          <p className={styles.heroText}>
            Consulte as Notas Fiscais Eletrônicas (NFe) do Poder Executivo
            Federal publicadas no Portal da Transparência — dados de emissão,
            fornecedor, órgão destinatário, itens e eventos das notas.
          </p>
          <div className={styles.heroLinks}>
            <a
              href={PORTAL_NOTAS_FISCAIS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consulta original no Portal
            </a>
            <a
              href={REGISTRO_API_KEY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Obter chave de API
            </a>
          </div>
        </header>

        <section className={styles.card}>
          <FormularioBusca
            chave={chave}
            cnpjEmitente={cnpjEmitente}
            codigoOrgao={codigoOrgao}
            nomeProduto={nomeProduto}
          />
        </section>

        {view.kind === "prompt" && <Prompts />}
        {view.kind === "error" && (
          <Erro
            message={view.message}
            status={view.status}
            needsKey={view.needsKey}
          />
        )}
        {view.kind === "list" && (
          <ListaNotas
            notas={view.notas}
            pagina={view.pagina}
            parametrosAtuais={sp}
          />
        )}
        {view.kind === "detail" && (
          <DetalheNota
            detalhe={view.detalhe}
            chave={view.chave}
            parametrosAtuais={sp}
          />
        )}
      </main>
    </div>
  );
}

function FormularioBusca({
  chave,
  cnpjEmitente,
  codigoOrgao,
  nomeProduto,
}: {
  chave: string;
  cnpjEmitente: string;
  codigoOrgao: string;
  nomeProduto: string;
}) {
  return (
    <form method="get" action="/" className={styles.form}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Chave de acesso (consulta detalhada)</span>
          <input
            type="text"
            name="chave"
            inputMode="numeric"
            placeholder="44 dígitos da NFe"
            defaultValue={chave}
          />
        </label>
        <label className={styles.field}>
          <span>CNPJ do emitente</span>
          <input
            type="text"
            name="cnpjEmitente"
            inputMode="numeric"
            placeholder="Somente números"
            defaultValue={cnpjEmitente}
          />
        </label>
        <label className={styles.field}>
          <span>Órgão destinatário (código SIAFI)</span>
          <input
            type="text"
            name="codigoOrgao"
            inputMode="numeric"
            placeholder="Ex.: 26000"
            defaultValue={codigoOrgao}
          />
        </label>
        <label className={styles.field}>
          <span>Nome do produto/serviço</span>
          <input
            type="text"
            name="nomeProduto"
            placeholder="Ex.: combustível, material de escritório"
            defaultValue={nomeProduto}
          />
        </label>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.primary}>
          Consultar
        </button>
        <a href="/" className={styles.secondary}>
          Limpar
        </a>
      </div>
    </form>
  );
}

function Prompts() {
  return (
    <div className={styles.card}>
      <h2>Como funciona</h2>
      <ul className={styles.howTo}>
        <li>
          Configure a <strong>chave da API</strong> na variável de ambiente{" "}
          <code>GOV_API_KEY</code>. A chave é obtida gratuitamente no{" "}
          <a
            href={REGISTRO_API_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            cadastro de e-mail da API
          </a>
          .
        </li>
        <li>
          Use a <strong>chave de acesso da NFe</strong> (44 dígitos) para
          consultar o detalhe de uma nota: itens, valores e eventos.
        </li>
        <li>
          Ou filtre a lista por <strong>CNPJ do emitente</strong>,{" "}
          <strong>órgão destinatário</strong> (código SIAFI) e{" "}
          <strong>nome do produto/serviço</strong>.
        </li>
        <li>
          Cada página retorna até 20 registros. Use a paginação para navegar
          entre os resultados.
        </li>
      </ul>
    </div>
  );
}

function Erro({
  message,
  status,
  needsKey,
}: {
  message: string;
  status?: number;
  needsKey: boolean;
}) {
  return (
    <div className={`${styles.card} ${styles.error}`} role="alert">
      <h2>{needsKey ? "Chave de API necessária" : "Falha na consulta"}</h2>
      <p>{message}</p>
      {status && <p className={styles.muted}>Código HTTP: {status}</p>}
      {needsKey && (
        <p>
          Cadastre um e-mail em{" "}
          <a
            href={REGISTRO_API_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            portaldatransparencia.gov.br/api-de-dados/cadastrar-email
          </a>{" "}
          para receber a chave de acesso à API e configure a variável de
          ambiente <code>GOV_API_KEY</code>.
        </p>
      )}
    </div>
  );
}

function ListaNotas({
  notas,
  pagina,
  parametrosAtuais,
}: {
  notas: NotaFiscal[];
  pagina: number;
  parametrosAtuais: SearchParams;
}) {
  if (notas.length === 0) {
    return (
      <div className={`${styles.card} ${styles.error}`}>
        <h2>Nenhuma nota fiscal encontrada</h2>
        <p>
          Não foram encontrados registros para os filtros informados. Tente
          outra combinação.
        </p>
        <a href="/" className={styles.secondary}>
          Limpar filtros
        </a>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Resultados</h2>
        <span className={styles.muted}>
          Página {pagina} · {notas.length} registro(s) nesta página
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Chave de acesso</th>
              <th>Data de emissão</th>
              <th>Emitente / Fornecedor</th>
              <th>Município do fornecedor</th>
              <th>Órgão destinatário</th>
              <th>Órgão superior</th>
              <th>Valor</th>
              <th>Evento mais recente</th>
              <th aria-label="Detalhes" />
            </tr>
          </thead>
          <tbody>
            {notas.map((nota) => {
              const chave = formatChave(nota.chaveNotaFiscal);
              const detalheHref = `/?chave=${chave}`;
              return (
                <tr key={nota.id}>
                  <td className={styles.mono}>
                    <a href={detalheHref}>{chave}</a>
                  </td>
                  <td>{formatDate(nota.dataEmissao)}</td>
                  <td>
                    <div>{nota.nomeFornecedor}</div>
                    <div className={styles.muted}>
                      {formatCnpj(nota.cnpjFornecedor)}
                    </div>
                  </td>
                  <td>{nota.municipioFornecedor}</td>
                  <td>
                    <div>{nota.orgaoDestinatario}</div>
                    <div className={styles.muted}>
                      {nota.codigoOrgaoDestinatario}
                    </div>
                  </td>
                  <td>
                    <div>{nota.orgaoSuperiorDestinatario}</div>
                    <div className={styles.muted}>
                      {nota.codigoOrgaoSuperiorDestinatario}
                    </div>
                  </td>
                  <td>{formatBRL(nota.valorNotaFiscal)}</td>
                  <td>
                    <div>{nota.tipoEventoMaisRecente}</div>
                    <div className={styles.muted}>
                      {formatDateTime(nota.dataTipoEventoMaisRecente)}
                    </div>
                  </td>
                  <td>
                    <a className={styles.linkDetail} href={detalheHref}>
                      Detalhes
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginacao pagina={pagina} parametrosAtuais={parametrosAtuais} />
    </div>
  );
}

function Paginacao({
  pagina,
  parametrosAtuais,
}: {
  pagina: number;
  parametrosAtuais: SearchParams;
}) {
  const href = (paginaAlvo: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(parametrosAtuais)) {
      if (typeof value === "string" && key !== "pagina") query.set(key, value);
    }
    if (paginaAlvo > 1) query.set("pagina", String(paginaAlvo));
    const qs = query.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      {pagina > 1 ? (
        <a className={styles.secondary} href={href(pagina - 1)}>
          ← Anterior
        </a>
      ) : (
        <span className={`${styles.secondary} ${styles.disabled}`}>
          ← Anterior
        </span>
      )}
      <span className={styles.muted}>Página {pagina}</span>
      <a className={styles.secondary} href={href(pagina + 1)}>
        Próxima →
      </a>
    </nav>
  );
}

function DetalheNota({
  detalhe,
  chave,
  parametrosAtuais,
}: {
  detalhe: DetalheNotaFiscal;
  chave: string;
  parametrosAtuais: SearchParams;
}) {
  const nota = detalhe.notaFiscalDTO;
  const voltaHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(parametrosAtuais)) {
      if (typeof value === "string" && key !== "chave" && key !== "pagina")
        query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/?${qs}` : "/";
  })();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <a href={voltaHref} className={styles.secondary}>
          ← Voltar
        </a>
        <h2>Detalhamento da Nota Fiscal</h2>
      </div>

      <dl className={styles.detailGrid}>
        <CampoChave label="Chave de acesso" valor={chave} mono />
        <Campo
          label="Número"
          valor={`${nota.serie ? `${nota.serie}/` : ""}${nota.numero}`}
        />
        <Campo label="Data de emissão" valor={formatDate(nota.dataEmissao)} />
        <Campo label="Valor da nota" valor={formatBRL(nota.valorNotaFiscal)} />
        <Campo
          label="Emitente"
          valor={`${nota.nomeFornecedor} — ${formatCnpj(nota.cnpjFornecedor)}`}
        />
        <Campo label="Município do emitente" valor={nota.municipioFornecedor} />
        <Campo
          label="Órgão destinatário"
          valor={`${nota.orgaoDestinatario} (${nota.codigoOrgaoDestinatario})`}
        />
        <Campo
          label="Órgão superior destinatário"
          valor={`${nota.orgaoSuperiorDestinatario} (${nota.codigoOrgaoSuperiorDestinatario})`}
        />
        <Campo
          label="Evento mais recente"
          valor={nota.tipoEventoMaisRecente}
          sub={formatDateTime(nota.dataTipoEventoMaisRecente)}
        />
      </dl>

      <h3 className={styles.subsection}>Itens da nota fiscal</h3>
      {detalhe.itensNotaFiscal.length === 0 ? (
        <p className={styles.muted}>Nenhum item informado.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição do produto/serviço</th>
                <th>NCM/SH</th>
                <th>CFOP</th>
                <th>Quantidade</th>
                <th>Valor unitário</th>
                <th>Valor total</th>
              </tr>
            </thead>
            <tbody>
              {detalhe.itensNotaFiscal.map((item) => (
                <ItemLinha
                  key={`${item.numeroProduto}-${item.descricaoProdutoServico}-${item.cfop}`}
                  item={item}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className={styles.subsection}>Eventos da nota fiscal</h3>
      {detalhe.eventosNotaFiscal.length === 0 ? (
        <p className={styles.muted}>Nenhum evento registrado.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Evento</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {detalhe.eventosNotaFiscal.map((evento) => (
                <EventoLinha
                  key={`${evento.dataEvento}-${evento.tipoEvento}-${evento.evento}`}
                  evento={evento}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ItemLinha({ item }: { item: ItemNotaFiscal }) {
  return (
    <tr>
      <td>{item.numeroProduto}</td>
      <td>{item.descricaoProdutoServico}</td>
      <td className={styles.mono}>{item.codigoNcmSh || item.ncmSh}</td>
      <td className={styles.mono}>{item.cfop}</td>
      <td>
        {item.quantidade} {item.unidade}
      </td>
      <td>{formatBRL(item.valorUnitario)}</td>
      <td>{formatBRL(item.valor)}</td>
    </tr>
  );
}

function EventoLinha({ evento }: { evento: EventoNotaFiscal }) {
  return (
    <tr>
      <td>{formatDateTime(evento.dataEvento)}</td>
      <td>
        <div>{evento.evento}</div>
        {evento.tipoEvento && (
          <div className={styles.muted}>{evento.tipoEvento}</div>
        )}
      </td>
      <td>{evento.motivo}</td>
    </tr>
  );
}

function Campo({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string;
  sub?: string;
}) {
  return (
    <div className={styles.campo}>
      <dt>{label}</dt>
      <dd>
        {valor}
        {sub && <span className={styles.muted}>{sub}</span>}
      </dd>
    </div>
  );
}

function CampoChave({
  label,
  valor,
  mono,
}: {
  label: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className={`${styles.campo} ${mono ? styles.campoMono : ""}`}>
      <dt>{label}</dt>
      <dd className={styles.mono}>{valor}</dd>
    </div>
  );
}
