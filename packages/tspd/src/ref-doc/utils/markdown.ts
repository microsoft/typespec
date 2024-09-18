export const headings = {
  h1: hx(1),
  h2: hx(2),
  h3: hx(3),
  h4: hx(4),
  h5: hx(5),
  hx: (number: number, title: string) => {
    return "#".repeat(number) + " " + title;
  },
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

export function link(text: string, url: string) {
  return `[${text}](${url})`;
}

function escapeMarkdownTable(text: string) {
  return text.replace(/([^\\])(\|)/g, "$1\\$2").replace(/\n/g, "<br />");
}

export function table([header, ...rows]: string[][]) {
  const renderRow = (row: string[]): string => `| ${row.map(escapeMarkdownTable).join(" | ")} |`;

  return [
    renderRow(header),
    "|" + header.map((x) => "-".repeat(x.length + 2)).join("|") + "|",
    ...rows.map(renderRow),
  ].join("\n");
}

export type Tab = {
  id: string;
  label: string;
  content: string;
};

export function tabs(tabs: Tab[]) {
  const result = ["<Tabs>"];
  for (const tab of tabs) {
    result.push(
      `<TabItem value="${tab.id}" label="${tab.label}" default>`,
      "",
      tab.content,
      "",
      "</TabItem>",
    );
  }
  result.push("</Tabs>", "");
  return result.join("\n");
}

export interface MarkdownSection {
  kind: "section";
  title: string;
  body: MarkdownDoc;
}
export type MarkdownDoc = string | MarkdownSection | MarkdownDoc[];

export function renderMarkdowDoc(doc: MarkdownDoc, heading = 1) {
  const flattened: string[] = [];
  let currentHeading = heading;
  function render(doc: MarkdownDoc) {
    if (typeof doc === "string") {
      flattened.push(doc);
    } else if (Array.isArray(doc)) {
      doc.forEach(render);
    } else {
      flattened.push(headings.hx(currentHeading, doc.title));
      currentHeading++;
      render(doc.body);
      currentHeading--;
    }
  }
  render(doc);
  return flattened.join("\n");
}

export function section(title: string, body: MarkdownDoc): MarkdownSection {
  return {
    kind: "section",
    title,
    body,
  };
}
