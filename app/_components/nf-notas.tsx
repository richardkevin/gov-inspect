import {
  type DetalheNotaFiscal,
  formatBRL,
  formatChave,
  formatCnpj,
  formatDate,
  formatDateTime,
  type NotaFiscal,
  parseMoney,
} from "../../lib/portal-transparencia";
import styles from "./nf.module.css";
import { Campo, CampoChave, EventoLinha, ItemLinha } from "./nf-campo";
import {
  construirQuery,
  type PaginaAtual,
  type SearchParams,
} from "./nf-helpers";

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
