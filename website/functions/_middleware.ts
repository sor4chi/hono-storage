const SUPPORTED_LANGUAGES = ["en", "ja"];

const getBrowserLanguageFromHeader = (req: Request) => {
  const acceptLanguage = req.headers.get("Accept-Language");
  if (!acceptLanguage) return;
  const lang = acceptLanguage.split(",")[0].split("-")[0];
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  return lang;
}

const isi18nPath = (path: string) => {
  const parts = path.split("/");
  return SUPPORTED_LANGUAGES.includes(parts[1]);
};

const geti18nPath = (path: string, lang: string) => {
  const parts = path.split("/").filter((part) => part);
  return [lang, ...parts].join("/");
}

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  if (isi18nPath(url.pathname)) return await next();
  const lang = getBrowserLanguageFromHeader(request);
  if (!lang) return await next();
  const i18nPath = geti18nPath(url.pathname, lang);
  if (!i18nPath) return await next();
  const i18nedUrl = new URL(i18nPath, url.origin).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: i18nedUrl,
    },
  });
};
