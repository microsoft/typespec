import {
  For,
  Output,
  OutputDirectory,
  Refkey,
  refkey,
  render,
  Show,
  StatementList,
} from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Program } from "@typespec/compiler";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature, EntitySignature, FunctionSignature } from "../types.js";
import { DecoratorSignatureType, ValueOfModelTsInterfaceBody } from "./decorator-signature-type.js";
import { DollarDecoratorsType } from "./dollar-decorators-type.js";
import { DollarFunctionsType } from "./dollar-functions-type.jsx";
import { EntitySignatureTests } from "./entity-signature-tests.jsx";
import { FunctionSignatureType } from "./function-signature-type.jsx";
import { createTspdContext, TspdContext, useTspd } from "./tspd-context.js";

export interface EntitySignaturesProps {
  entities: EntitySignature[];
  namespaceName: string;
  dollarDecoratorsRefKey: Refkey;
  dollarFunctionsRefKey: Refkey;
}

export function EntitySignatures({
  namespaceName,
  entities,
  dollarDecoratorsRefKey: dollarDecoratorsRefkey,
  dollarFunctionsRefKey: dollarFunctionsRefkey,
}: EntitySignaturesProps) {
  const decorators = entities.filter((e): e is DecoratorSignature => e.kind === "Decorator");

  const functions = entities.filter((e): e is FunctionSignature => e.kind === "Function");

  return (
    <ts.TypeRefContext>
      <LocalTypes />
      <Show when={decorators.length > 0}>
        <hbr />
        <hbr />
        <For each={decorators} doubleHardline semicolon>
          {(signature) => <DecoratorSignatureType signature={signature} />}
        </For>
        <hbr />
        <hbr />
        <DollarDecoratorsType
          namespaceName={namespaceName}
          decorators={decorators}
          refkey={dollarDecoratorsRefkey}
        />
      </Show>
      <Show when={functions.length > 0}>
        <hbr />
        <hbr />
        <For each={functions} doubleHardline semicolon>
          {(signature) => <FunctionSignatureType signature={signature} />}
        </For>
        <hbr />
        <hbr />
        <DollarFunctionsType
          namespaceName={namespaceName}
          functions={functions}
          refkey={dollarFunctionsRefkey}
        />
      </Show>
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
  entities: EntitySignature[],
  libraryName: string,
  namespaceName: string,
): OutputDirectory {
  const context = createTspdContext(program);
  const base = namespaceName === "" ? "__global__" : namespaceName;
  const $decoratorsRef = refkey();
  const $functionsRef = refkey();
  const userLib = ts.createPackage({
    name: libraryName,
    version: "0.0.0",
    descriptor: {
      ".": {
        named: ["$decorators", "$functions"],
      },
    },
  });

  const jsxContent = (
    <TspdContext.Provider value={context}>
      <Output externals={[typespecCompiler, userLib]}>
        <ts.SourceFile path={`${base}.ts`}>
          <EntitySignatures
            namespaceName={namespaceName}
            entities={entities}
            dollarDecoratorsRefKey={$decoratorsRef}
            dollarFunctionsRefKey={$functionsRef}
          />
        </ts.SourceFile>
        {!base.includes(".Private") && (
          <ts.SourceFile
            path={`${base}.ts-test.ts`}
            headerComment="An error in the imports would mean that the decorator is not exported or doesn't have the right name."
          >
            <EntitySignatureTests
              namespaceName={namespaceName}
              entities={entities}
              dollarDecoratorRefKey={userLib.$decorators}
              dollarDecoratorsTypeRefKey={$decoratorsRef}
              dollarFunctionsRefKey={userLib.$functions}
              dollarFunctionsTypeRefKey={$functionsRef}
            />
          </ts.SourceFile>
        )}
      </Output>
    </TspdContext.Provider>
  );

  return render(jsxContent);
}
