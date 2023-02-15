import lzutf8 from "lzutf8";

export function getTypeSpecContentFromQueryParam(queryParameterName: string) {
  if (window.location.search.length > 0) {
    const parsed = new URLSearchParams(window.location.search);
    const compressed = parsed.get(queryParameterName);
    if (compressed) {
      return lzutf8.decompress(compressed, { inputEncoding: "Base64" });
    }
  }
}

export async function saveTypeSpecContentInQueryParameter(
  queryParameterName: string,
  content: string
) {
  const compressed = lzutf8.compress(content, { outputEncoding: "Base64" });
  history.pushState(null, "", window.location.pathname + "?c=" + encodeURIComponent(compressed));
  await navigator.clipboard.writeText(window.location.toString());
}
