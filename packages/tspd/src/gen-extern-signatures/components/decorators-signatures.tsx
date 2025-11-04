import {
  For,
  Output,
  OutputDirectory,
  Refkey,
  refkey,
  render,
  StatementList,
} from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { NoTarget, Program } from "@typespec/compiler";
import { reportDiagnostic } from "../../ref-doc/lib.js";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";
import { DecoratorSignatureTests } from "./decorator-signature-tests.jsx";
import {
  DecoratorSignatureType,
  ValueOfModelTsInterfaceBody,
} from "./decorator-signature-type.jsx";
import { DollarDecoratorsType } from "./dollar-decorators-type.jsx";
import { createTspdContext, TspdContext, useTspd } from "./tspd-context.js";

export interface DecoratorSignaturesProps {
  decorators: DecoratorSignature[];
  namespaceName: string;
  dollarDecoratorsRefKey: Refkey;
}

export function DecoratorSignatures({
  namespaceName,
  decorators,
  dollarDecoratorsRefKey: dollarDecoratorsRefkey,
}: DecoratorSignaturesProps) {
  return (
    <ts.TypeRefContext>
      <LocalTypes />
      <hbr />
      <hbr />
      <For each={decorators} doubleHardline>
        {(signature) => {
          return <DecoratorSignatureType signature={signature} />;
        }}
      </For>
      <hbr />
      <hbr />
      <DollarDecoratorsType
        namespaceName={namespaceName}
        decorators={decorators}
        refkey={dollarDecoratorsRefkey}
      />
    </ts.TypeRefContext>
  );
}

export function LocalTypes() {
  const { localTypes } = useTspd();
  return (
    <StatementList>
      <For each={localTypes} doubleHardline>
        {(type) => {
          return (
            <ts.InterfaceDeclaration export name={type.name} refkey={refkey(type)}>
              <ValueOfModelTsInterfaceBody model={type} />
            </ts.InterfaceDeclaration>
          );
        }}
      </For>
    </StatementList>
  );
}

export function generateSignatures(
  program: Program,
  decorators: DecoratorSignature[],
  libraryName: string,
  namespaceName: string,
): OutputDirectory {
  const context = createTspdContext(program);
  const base = namespaceName === "" ? "__global__" : namespaceName;
  const $decoratorsRef = refkey();
  const locations = [...new Set(decorators.map((d) => d.exportName ?? "."))];
  if (locations.length > 1) {
    reportDiagnostic(program, {
      code: "decorator-locations",
      format: { namespace: namespaceName },
      target: NoTarget,
    });
  }
  const descriptor = Object.fromEntries(
    locations.map((l) => {
      return [l, { named: ["$decorators"] }];
    }),
  );

  const userLib = ts.createPackage({
    name: libraryName,
    version: "0.0.0",
    descriptor,
  });
  const refKeys = locations.map((d) => {
    if (d === "." || !d) {
      return userLib.$decorators;
    } else {
      return userLib[d].$decorators;
    }
  });

  const jsxContent = (
    <TspdContext.Provider value={context}>
      <Output externals={[typespecCompiler, userLib]}>
        <ts.SourceFile path={`${base}.ts`}>
          <DecoratorSignatures
            namespaceName={namespaceName}
            decorators={decorators}
            dollarDecoratorsRefKey={$decoratorsRef}
          />
        </ts.SourceFile>
        {!base.includes(".Private") && (
          <ts.SourceFile
            path={`${base}.ts-test.ts`}
            headerComment="An error in the imports would mean that the decorator is not exported or doesn't have the right name."
          >
            <DecoratorSignatureTests
              namespaceName={namespaceName}
              refKeys={refKeys}
              dollarDecoratorsTypeRefKey={$decoratorsRef}
            />
          </ts.SourceFile>
        )}
      </Output>
    </TspdContext.Provider>
  );

  return render(jsxContent);
}
