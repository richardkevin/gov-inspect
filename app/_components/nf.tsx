import {
  type DetalheNotaFiscal,
  type EventoNotaFiscal,
  formatBRL,
  formatChave,
  formatCnpj,
  formatDate,
  formatDateTime,
  type ItemNotaFiscal,
  type NotaFiscal,
  parseMoney,
} from "../../lib/portal-transparencia";
import styles from "./nf.module.css";

export { styles };

export const REGISTRO_API_KEY_URL =
  "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email";
export const PORTAL_NOTAS_FISCAIS_URL =
  "https://portaldatransparencia.gov.br/notas-fiscais";

export type SearchParams = Record<string, string | string[] | undefined>;
export type PaginaAtual = "/" | "/notas" | "/api-docs";

export function getParam(searchParams: SearchParams, name: string): string {
  const value = searchParams[name];
  return typeof value === "string" ? value : "";
}

function construirQuery(
  parametrosAtuais: SearchParams,
  extras: Record<string, string>,
  ignorar: string[] = [],
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(parametrosAtuais)) {
    if (typeof value === "string" && !ignorar.includes(key)) {
      query.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(extras)) {
    if (value) query.set(key, value);
    else query.delete(key);
  }
  return query.toString();
}

export function Navegacao({ atual }: { atual: PaginaAtual }) {
  const item = (href: PaginaAtual, label: string) => (
    <a href={href} className={href === atual ? styles.active : undefined}>
      {label}
    </a>
  );
  return (
    <nav className={styles.navTabs} aria-label="Navegação">
      {item("/", "Consulta direta")}
      {item("/notas", "Tabela de notas fiscais")}
      {item("/api-docs", "Documentação da API")}
    </nav>
  );
}

export function Hero({
  atual,
  titulo,
  descricao,
}: {
  atual: PaginaAtual;
  titulo: string;
  descricao: string;
}) {
  return (
    <header className={styles.hero}>
      <Navegacao atual={atual} />
      <span className={styles.eyebrow}>
        Portal da Transparência do Governo Federal
      </span>
      <h1>{titulo}</h1>
      <p className={styles.heroText}>{descricao}</p>
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
  );
}

export function Prompts() {
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
          Na <strong>consulta direta</strong>, use a{" "}
          <strong>chave de acesso da NFe</strong> (44 dígitos) para consultar o
          detalhe de uma nota: itens, valores e eventos.
        </li>
        <li>
          Ou navegue pela{" "}
          <a href="/notas">
            <strong>tabela de notas fiscais</strong>
          </a>{" "}
          filtrando por <strong>CNPJ do emitente</strong>,{" "}
          <strong>órgão destinatário</strong> (código SIAFI) e{" "}
          <strong>nome do produto/serviço</strong>.
        </li>
        <li>
          Para ver <strong>todas as notas emitidas num mês</strong>, informe o{" "}
          <strong>mês de emissão</strong> combinado com o CNPJ do emitente ou o
          órgão destinatário. O app percorre os resultados e lista todas as
          notas daquele mês, com contagem e valor total.
        </li>
        <li>
          Cada página retorna até 20 registros. Use a paginação para navegar
          entre os resultados.
        </li>
      </ul>
    </div>
  );
}

export function Erro({
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

export function FormularioChave({ chave }: { chave: string }) {
  return (
    <form method="get" action="/" className={styles.form}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Chave de acesso da NFe</span>
          <input
            type="text"
            name="chave"
            inputMode="numeric"
            placeholder="44 dígitos da NFe"
            defaultValue={chave}
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

export function FiltrosNotas({
  cnpjEmitente,
  codigoOrgao,
  nomeProduto,
  mes,
}: {
  cnpjEmitente: string;
  codigoOrgao: string;
  nomeProduto: string;
  mes: string;
}) {
  return (
    <form method="get" action="/notas" className={styles.form}>
      <div className={styles.formGrid}>
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
        <label className={styles.field}>
          <span>Mês de emissão (combine com CNPJ ou órgão)</span>
          <input
            type="month"
            name="mes"
            defaultValue={mes}
            title="Ex.: 2026-08"
          />
        </label>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.primary}>
          Filtrar
        </button>
        <a href="/notas" className={styles.secondary}>
          Limpar
        </a>
      </div>
    </form>
  );
}

export function ListaNotas({
  notas,
  pagina,
  parametrosAtuais,
  mes,
}: {
  notas: NotaFiscal[];
  pagina: number;
  parametrosAtuais: SearchParams;
  mes?: string;
}) {
  if (notas.length === 0) {
    return (
      <div className={`${styles.card} ${styles.error}`}>
        <h2>Nenhuma nota fiscal encontrada</h2>
        <p>
          Não foram encontrados registros para os filtros informados. Tente
          outra combinação.
        </p>
        <a href="/notas" className={styles.secondary}>
          Limpar filtros
        </a>
      </div>
    );
  }

  const total = notas.reduce(
    (acc, nota) => acc + (parseMoney(nota.valorNotaFiscal) ?? 0),
    0,
  );
  const subtitulo = mes
    ? `${notas.length} nota(s) no mês · Total: ${formatBRL(total.toFixed(2))}`
    : `Página ${pagina} · ${notas.length} registro(s) nesta página`;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Resultados</h2>
        <span className={styles.muted}>{subtitulo}</span>
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
              const detalheHref = construirQuery(
                parametrosAtuais,
                { chave, pagina: "" },
                ["pagina"],
              );
              return (
                <tr key={nota.id}>
                  <td className={styles.mono}>
                    <a href={`/notas?${detalheHref}`}>{chave}</a>
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
                    <a
                      className={styles.linkDetail}
                      href={`/notas?${detalheHref}`}
                    >
                      Detalhes
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!mes && (
        <Paginacao pagina={pagina} parametrosAtuais={parametrosAtuais} />
      )}
    </div>
  );
}

export function Paginacao({
  pagina,
  parametrosAtuais,
}: {
  pagina: number;
  parametrosAtuais: SearchParams;
}) {
  const href = (paginaAlvo: number) => {
    const query = construirQuery(
      parametrosAtuais,
      { pagina: paginaAlvo > 1 ? String(paginaAlvo) : "" },
      ["pagina"],
    );
    return query ? `/notas?${query}` : "/notas";
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

export function DetalheNota({
  detalhe,
  chave,
  parametrosAtuais,
  base,
}: {
  detalhe: DetalheNotaFiscal;
  chave: string;
  parametrosAtuais: SearchParams;
  base: PaginaAtual;
}) {
  const nota = detalhe.notaFiscalDTO;
  const voltaHref = (() => {
    const query = construirQuery(parametrosAtuais, { chave: "" }, [
      "chave",
      "pagina",
    ]);
    return query ? `${base}?${query}` : base;
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
