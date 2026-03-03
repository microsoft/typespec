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

export function createTypekitDocs(typekit: TypekitCollection, packageName?: string) {
  const isHttpPackage = packageName === "@typespec/http";
  const experimentalImport = isHttpPackage
    ? `import "@typespec/http/experimental/typekit";`
    : `import "@typespec/compiler/typekit";`;
  
  const usageExample = isHttpPackage
    ? `\`\`\`ts
import { getHttpOperation } from "@typespec/http";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http/experimental/typekit";

const [httpOperation] = getHttpOperation(program, operation);
const responses = $(program).httpOperation.flattenResponses(httpOperation);
\`\`\``
    : `\`\`\`ts
import { $ } from "@typespec/compiler/typekit";

// Use typekits in your code
const arrayType = $(program).array.create(stringType);
\`\`\``;

  const jsxContent = (
    <Output>
      <md.SourceFile path={`typekits.mdx`}>
        <>
          <md.Frontmatter jsValue={{ title: "[API] Typekits" }} />
          {code`
        import { Badge${typekit.isExperimental ? ", Aside" : ""} } from '@astrojs/starlight/components';
        `}
        </>
        {typekit.isExperimental && (
          <>
            {code`
        
        <Aside type="caution">
        **Experimental Feature**: These typekits are currently experimental. The API surface is volatile and may have breaking changes without notice. Use with caution in production environments.
        </Aside>
        
        ## Usage
        
        To use these typekits in your TypeSpec emitter or tool, you need to import the${isHttpPackage ? " experimental" : ""} typekit module:
        
        \`\`\`ts
        ${experimentalImport}
        import { $ } from "@typespec/compiler/typekit";
        \`\`\`
        
        The first import registers the${isHttpPackage ? " HTTP-specific" : ""} typekit extensions. This import only needs to exist once in your compilation as only its side effects are important.
        
        ### Example
        
        ${usageExample}
        `}
          </>
        )}
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
  await traverseOutput(output, {
    visitDirectory: () => {},
    visitFile: (file) => rawFiles.push(file),
  });

  for (const file of rawFiles) {
    if ("contents" in file) {
      files[file.path] = await format(file.contents);
    }
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
