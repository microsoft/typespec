import lzutf8 from "lzutf8";
// import { PlaygroundDefaultState } from "./components/playground.js";
type PlaygroundDefaultState = any;
export async function saveTypeSpecContentInQueryParameter(content: string) {
  const compressed = lzutf8.compress(content, { outputEncoding: "Base64" });
  history.pushState(null, "", window.location.pathname + "?c=" + encodeURIComponent(compressed));
  await navigator.clipboard.writeText(window.location.toString());
}

export function getStateFromUrl(): PlaygroundDefaultState {
  if (window.location.search.length === 0) {
    return {};
  }
  const parsed = new URLSearchParams(window.location.search);

  const state: PlaygroundDefaultState = {};
  const content = parsed.get("c");
  if (content) {
    state.content = lzutf8.decompress(content, { inputEncoding: "Base64" });
  }
  const sample = parsed.get("sample");
  if (sample) {
    state.sampleName = sample;
  }
  return state;
}
