import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Program } from "@typespec/compiler";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";
import { DecoratorSignatureTests } from "./decorator-signature-tests.jsx";
import {
  DecoratorSignatureType,
  ValueOfModelTsInterfaceBody,
} from "./decorator-signature-type.jsx";
import { DollarDecoratorsType } from "./dollard-decorators-type.jsx";
import { createTspdContext, TspdContext, useTspd } from "./tspd-context.js";

export interface DecoratorSignaturesProps {
  decorators: DecoratorSignature[];
  namespaceName: string;
  dollarDecoratorsRefKey: ay.Refkey;
}

export function DecoratorSignatures({
  namespaceName,
  decorators,
  dollarDecoratorsRefKey: dollarDecoratorsRefkey,
}: DecoratorSignaturesProps) {
  return (
    <>
      <LocalTypes />
      <hbr />
      <hbr />
      <ay.For each={decorators} joiner={"\n\n"}>
        {(signature) => {
          return <DecoratorSignatureType signature={signature} />;
        }}
      </ay.For>
      <hbr />
      <hbr />
      <DollarDecoratorsType
        namespaceName={namespaceName}
        decorators={decorators}
        refkey={dollarDecoratorsRefkey}
      />
    </>
  );
}

export function LocalTypes() {
  const { localTypes } = useTspd();
  return (
    <ay.StatementList>
      <ay.For each={localTypes} joiner={"\n"}>
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

export function generateSignatures(
  program: Program,
  decorators: DecoratorSignature[],
  libraryName: string,
  namespaceName: string,
): ay.OutputDirectory {
  const context = createTspdContext(program);
  const base = namespaceName === "" ? "__global__" : namespaceName;
  const $decoratorsRef = ay.refkey();
  const userLib = ts.createPackage({
    name: libraryName,
    version: "0.0.0",
    descriptor: {
      ".": {
        named: ["$decorators"],
      },
    },
  });

  const jsxContent = (
    <TspdContext.Provider value={context}>
      <ay.Output externals={[typespecCompiler, userLib]}>
        <ts.SourceFile path={`${base}.ts`}>
          <DecoratorSignatures
            namespaceName={namespaceName}
            decorators={decorators}
            dollarDecoratorsRefKey={$decoratorsRef}
          />
        </ts.SourceFile>
        <ts.SourceFile path={`${base}.ts-test.ts`}>
          <DecoratorSignatureTests
            namespaceName={namespaceName}
            dollarDecoratorRefKey={userLib.$decorators}
            dollarDecoratorsTypeRefKey={$decoratorsRef}
          />
        </ts.SourceFile>
      </ay.Output>
    </TspdContext.Provider>
  );

  return ay.render(jsxContent);
}
