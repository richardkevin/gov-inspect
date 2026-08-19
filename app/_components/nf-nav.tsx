import styles from "./nf.module.css";
import type { PaginaAtual } from "./nf-helpers";
import { REGISTRO_API_KEY_URL } from "./nf-helpers";

export { styles };

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
