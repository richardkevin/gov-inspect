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

export function construirQuery(
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
