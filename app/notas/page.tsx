import type { Metadata } from "next";
import {
  consultarNotaFiscalPorChave,
  type DetalheNotaFiscal,
  getApiKey,
  listarNotasFiscais,
  listarNotasFiscaisPorMes,
  type NotaFiscal,
  PortalApiError,
} from "../../lib/portal-transparencia";
import {
  DetalheNota,
  Erro,
  FiltrosNotas,
  getParam,
  Hero,
  ListaNotas,
  Prompts,
  styles,
} from "../_components/nf";

export const metadata: Metadata = {
  title: "Tabela de Notas Fiscais — Portal da Transparência",
  description:
    "Navegue pela tabela de Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal, filtrando por emitente, órgão destinatário e produto.",
};

export const dynamic = "force-dynamic";

type View =
  | { kind: "prompt" }
  | { kind: "list"; notas: NotaFiscal[]; pagina: number; mes?: string }
  | { kind: "detail"; detalhe: DetalheNotaFiscal; chave: string }
  | { kind: "error"; message: string; status?: number; needsKey: boolean };

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const chave = getParam(sp, "chave");
  const cnpjEmitente = getParam(sp, "cnpjEmitente");
  const codigoOrgao = getParam(sp, "codigoOrgao");
  const nomeProduto = getParam(sp, "nomeProduto");
  const mes = getParam(sp, "mes");
  const mesSelecionado = /^\d{4}-\d{2}$/.test(mes) ? mes : "";
  const pagina = Math.max(1, Number.parseInt(getParam(sp, "pagina"), 10) || 1);

  const apiKey = getApiKey();
  const temFiltro = Boolean(
    cnpjEmitente || codigoOrgao || nomeProduto || pagina > 1,
  );
  const mesSemFiltro = Boolean(mesSelecionado && !temFiltro);
  const submitted = Boolean(chave || mesSelecionado || temFiltro);

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
      } else if (mesSemFiltro) {
        view = {
          kind: "error",
          needsKey: false,
          message:
            "Para listar todas as notas de um mês, informe também o CNPJ do emitente ou o órgão destinatário. A API do Portal não filtra por data, então o app percorre os resultados desses filtros em busca das notas do mês.",
        };
      } else if (mesSelecionado) {
        const notas = await listarNotasFiscaisPorMes(
          { mes: mesSelecionado, cnpjEmitente, codigoOrgao, nomeProduto },
          apiKey,
        );
        view = { kind: "list", notas, pagina, mes: mesSelecionado };
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
        <Hero
          atual="/notas"
          titulo="Tabela de Notas Fiscais"
          descricao="Navegue pelas Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal publicadas no Portal da Transparência — valores, emitente, fornecedor, órgão destinatário, itens e eventos."
        />

        <section className={styles.card}>
          <FiltrosNotas
            cnpjEmitente={cnpjEmitente}
            codigoOrgao={codigoOrgao}
            nomeProduto={nomeProduto}
            mes={mes}
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
            mes={view.mes}
          />
        )}
        {view.kind === "detail" && (
          <DetalheNota
            detalhe={view.detalhe}
            chave={view.chave}
            parametrosAtuais={sp}
            base="/notas"
          />
        )}
      </main>
    </div>
  );
}
