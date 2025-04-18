import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Program } from "@typespec/compiler";
import { DecoratorSignatureType } from "./components/decorator-signature-type.jsx";
import { DollarDecoratorsType } from "./components/dollard-decorators-type.jsx";
import { TspContext } from "./components/tsp-context.js";
import { Doc, renderDoc } from "./doc-builder.js";
import { typespecCompiler } from "./external-packages/compiler.js";
import { DecoratorSignature } from "./types.js";

const line = "\n";
export function generateSignatureTests(
  namespaceName: string,
  importName: string,
  decoratorSignatureImport: string,
  decorators: DecoratorSignature[],
): string {
  const content: Doc[] = [];
  const decRecord = getDecoratorRecordForNamespaceName(namespaceName);
  content.push([
    "/** An error here would mean that the decorator is not exported or doesn't have the right name. */",
    line,
    `import { $decorators } from "`,
    importName,
    `";`,
    line,
  ]);

  content.push(`import type { ${decRecord} } from "${decoratorSignatureImport}";`);

  content.push(line);

  content.push([
    "/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */",
    line,
    `const _: ${decRecord} = $decorators["${namespaceName}"]`,
  ]);
  return renderDoc(content);
}

function getDecoratorRecordForNamespaceName(namespaceName: string) {
  return `${namespaceName.replaceAll(".", "")}Decorators`;
}

export function generateSignatures(
  program: Program,
  decorators: DecoratorSignature[],
  namespaceName: string,
): string {
  const jsxContent = (
    <TspContext.Provider value={{ program }}>
      <ay.Output externals={[typespecCompiler]}>
        <ts.SourceFile path="foo.tsx">
          <ay.For each={decorators} joiner={line + line}>
            {(signature) => {
              return <DecoratorSignatureType signature={signature} />;
            }}
          </ay.For>
          <hbr />
          <hbr />
          <DollarDecoratorsType namespaceName={namespaceName} decorators={decorators} />
        </ts.SourceFile>
      </ay.Output>
    </TspContext.Provider>
  );

  return ay.printTree(ay.renderTree(jsxContent));
}
