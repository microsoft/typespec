import { Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

export interface DecoratorSignatureTests {
  namespaceName: string;
  dollarDecoratorRefKey: Refkey;
  dollarDecoratorsTypeRefKey: Refkey;
}

export function DecoratorSignatureTests({
  namespaceName,
  dollarDecoratorRefKey,
  dollarDecoratorsTypeRefKey,
}: Readonly<DecoratorSignatureTests>) {
  return (
    <>
      <hbr />
      <hbr />
      <ts.VarDeclaration
        name="_"
        type={dollarDecoratorsTypeRefKey}
        doc="An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ..."
      >
        {dollarDecoratorRefKey}
        {`["${namespaceName}"]`}
      </ts.VarDeclaration>
    </>
  );
}
