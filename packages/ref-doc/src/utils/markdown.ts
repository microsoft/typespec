export const headings = {
  h1: hx(1),
  h2: hx(2),
  h3: hx(3),
  h4: hx(4),
  h5: hx(5),
};

function hx(number: number) {
  const prefix = "#".repeat(number) + " ";
  return (title: string) => prefix + title;
}

export function codeblock(code: string, lang: string = "") {
  return "```" + lang + "\n" + code + "\n" + "```";
}

export function inlinecode(code: string) {
  return "`" + code + "`";
}
