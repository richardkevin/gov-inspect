import type { Metadata } from "next";
import {
  consultarNotaFiscalPorChave,
  type DetalheNotaFiscal,
  getApiKey,
  PortalApiError,
} from "../lib/portal-transparencia";
import {
  DetalheNota,
  Erro,
  FormularioChave,
  getParam,
  Hero,
  Prompts,
  styles,
} from "./_components/nf";

export const metadata: Metadata = {
  title: "Notas Fiscais — Portal da Transparência",
  description:
    "Consulte o detalhe de uma Nota Fiscal Eletrônica (NFe) do Poder Executivo Federal pela chave de acesso.",
};

export const dynamic = "force-dynamic";

type View =
  | { kind: "prompt" }
  | { kind: "detail"; detalhe: DetalheNotaFiscal; chave: string }
  | { kind: "error"; message: string; status?: number; needsKey: boolean };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const chave = getParam(sp, "chave");

  const apiKey = getApiKey();
  const submitted = Boolean(chave);

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
      const detalhe = await consultarNotaFiscalPorChave(chave, apiKey);
      view = { kind: "detail", detalhe, chave };
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
          atual="/"
          titulo="Notas Fiscais"
          descricao="Consulte o detalhe de uma Nota Fiscal Eletrônica (NFe) do Poder Executivo Federal pela chave de acesso, ou navegue pela tabela de notas publicadas no Portal da Transparência."
        />

        <section className={styles.card}>
          <FormularioChave chave={chave} />
        </section>

        {view.kind === "prompt" && <Prompts />}
        {view.kind === "error" && (
          <Erro
            message={view.message}
            status={view.status}
            needsKey={view.needsKey}
          />
        )}
        {view.kind === "detail" && (
          <DetalheNota
            detalhe={view.detalhe}
            chave={view.chave}
            parametrosAtuais={sp}
            base="/"
          />
        )}
      </main>
    </div>
  );
}
