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

export function createTypekitDocs(typekit: TypekitCollection, packageName: string) {
  // Determine the import path based on package name and experimental status
  const isHttpPackage = packageName === "@typespec/http";
  const isCompilerPackage = packageName === "@typespec/compiler";

  // Generate import statement based on package
  let importStatement: string;
  if (isHttpPackage && typekit.isExperimental) {
    importStatement = `import "@typespec/http/experimental/typekit";`;
  } else if (isCompilerPackage) {
    importStatement = `import "@typespec/compiler/typekit";`;
  } else {
    // Generic case for other packages
    importStatement = `import "${packageName}/typekit";`;
  }

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
        
        To use these typekits in your TypeSpec emitter or tool, you need to import the typekit module:
        
        \`\`\`ts
        ${importStatement}
        import { $ } from "@typespec/compiler/typekit";
        \`\`\`
        
        The first import registers the typekit extensions. This import only needs to exist once in your compilation as only its side effects are important.
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
