import {
  code,
  For,
  Output,
  OutputDirectory,
  OutputFile,
  render,
  traverseOutput,
} from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { format as prettierFormat } from "prettier";
import { TypekitCollection } from "../typekit-docs.js";
import { TypekitSection } from "./typekit-section.js";

export function createTypekitDocs(typekit: TypekitCollection) {
  const jsxContent = (
    <Output>
      <md.SourceFile path={`typekits.mdx`}>
        <>
          <md.Frontmatter jsValue={{ title: "[API] Typekits" }} />
          {code`
        import { Badge } from '@astrojs/starlight/components';
        `}
        </>
        <md.Section>
          <For each={Object.values(typekit.namespaces)}>
            {(x) => <TypekitSection typekit={x} />}
          </For>
        </md.Section>
      </md.SourceFile>
    </Output>
  );

  return flattenOutput(render(jsxContent));
}

async function flattenOutput(output: OutputDirectory): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const rawFiles: OutputFile[] = [];
  traverseOutput(output, {
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
