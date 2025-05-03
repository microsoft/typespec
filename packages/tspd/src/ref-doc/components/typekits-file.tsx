import * as ay from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { format as prettierFormat } from "prettier";
import { TypekitApi } from "../typekit-docs.js";
import { TypekitSection } from "./typekit-section.js";

export function createTypekitDocs(typekit: TypekitApi) {
  const jsxContent = (
    <ay.Output>
      <md.SourceFile path={`typekits.mdx`}>
        <>
          {ay.code`
        ---
        title: "[API] Typekits"
        ---
        import { Badge } from '@astrojs/starlight/components';
        `}
        </>
        <md.Section heading={"Typekits"}>
          <ay.For each={Object.values(typekit.entries)}>
            {(x) => <TypekitSection typekit={x as any} />}
          </ay.For>
        </md.Section>
      </md.SourceFile>
    </ay.Output>
  );

  return flattenOutput(ay.render(jsxContent));
}

async function flattenOutput(output: ay.OutputDirectory): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const rawFiles: ay.OutputFile[] = [];
  ay.traverseOutput(output, {
    visitDirectory: () => {},
    visitFile: (file) => rawFiles.push(file),
  });

  for (const file of rawFiles) {
    files[file.path] = await format(file.contents);
  }
  return files;
}

function format(value: string) {
  try {
    const formatted = prettierFormat(value, {
      parser: "markdown",
    });
    return formatted;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error formatting", e);
    return value;
  }
}
