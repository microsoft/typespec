import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Program } from "@typespec/compiler";
import {
  DecoratorSignatureType,
  ValueOfModelTsInterfaceBody,
} from "./components/decorator-signature-type.jsx";
import { DollarDecoratorsType } from "./components/dollard-decorators-type.jsx";
import { createTspdContext, TspdContext } from "./components/tspd-context.js";
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
  const context = createTspdContext(program);
  const jsxContent = (
    <TspdContext.Provider value={context}>
      <ay.Output externals={[typespecCompiler]}>
        <ts.SourceFile path="foo.tsx">
          <LocalTypes localTypes={context.localTypes} />
          <hbr />
          <hbr />
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
    </TspdContext.Provider>
  );

  return ay.printTree(ay.renderTree(jsxContent));
}

export function LocalTypes(props: { localTypes: Model[] }) {
  return (
    <ay.StatementList>
      <ay.For each={props.localTypes} joiner={line}>
        {(type) => {
          return (
            <ts.InterfaceDeclaration export name={type.name} refkey={ay.refkey(type)}>
              <ValueOfModelTsInterfaceBody model={type} />
            </ts.InterfaceDeclaration>
          );
        }}
      </ay.For>
    </ay.StatementList>
  );
}
