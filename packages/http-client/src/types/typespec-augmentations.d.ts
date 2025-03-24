import { HttpAuth } from "@typespec/http";
import { authSchemeSymbol, credentialSymbol } from "./credential-symbol.ts";

declare module "@typespec/compiler" {
  interface ModelProperty {
    [credentialSymbol]?: boolean;
  }

  interface StringLiteral {
    [authSchemeSymbol]?: HttpAuth;
  }
}
