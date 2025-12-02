import { Refkey, Show } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EntitySignature } from "../types.js";

export interface EntitySignatureTests {
  namespaceName: string;
  entities: EntitySignature[];
  dollarDecoratorRefKey: Refkey;
  dollarDecoratorsTypeRefKey: Refkey;
  dollarFunctionsRefKey: Refkey;
  dollarFunctionsTypeRefKey: Refkey;
}

export function EntitySignatureTests({
  namespaceName,
  entities,
  dollarDecoratorRefKey,
  dollarDecoratorsTypeRefKey,
  dollarFunctionsRefKey,
  dollarFunctionsTypeRefKey,
}: Readonly<EntitySignatureTests>) {
  const hasDecorators = entities.some((e) => e.kind === "Decorator");
  const hasFunctions = entities.some((e) => e.kind === "Function");

  return (
    <>
      <Show when={hasDecorators}>
        <hbr />
        <hbr />
        <ts.VarDeclaration
          name="_decs"
          type={dollarDecoratorsTypeRefKey}
          doc="An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ..."
        >
          {dollarDecoratorRefKey}
          {`["${namespaceName}"]`}
        </ts.VarDeclaration>
      </Show>
      <Show when={hasFunctions}>
        <hbr />
        <hbr />
        <ts.VarDeclaration
          name="_funcs"
          type={dollarFunctionsTypeRefKey}
          doc="An error here would mean that the exported function is not using the same signature. Make sure to have export const $funcName: FuncNameFunction = (...) => ..."
        >
          {dollarFunctionsRefKey}
          {`["${namespaceName}"]`}
        </ts.VarDeclaration>
      </Show>
    </>
  );
}
