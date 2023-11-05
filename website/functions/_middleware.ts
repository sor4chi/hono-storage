const getBrowserLanguage = () => {
  if (typeof window === "undefined") return "en";
  const lang = window.navigator.language;
  if (lang.indexOf("ja") === 0) return "ja";
  if (lang.indexOf("en") === 0) return "en";
  return "ja";
};

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const lang = getBrowserLanguage();
  if (lang === "en") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/en${request.url}`,
      },
    });
  }
  if (lang === "ja") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/ja${request.url}`,
      },
    });
  }
  return next();
};
