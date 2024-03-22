export type Doc = string | Doc[];

export function renderDoc(doc: Doc) {
  const flattened: string[] = [];
  function render(doc: Doc) {
    if (typeof doc === "string") {
      flattened.push(doc);
    } else {
      doc.forEach(render);
    }
  }
  render(doc);
  return flattened.join("");
}
