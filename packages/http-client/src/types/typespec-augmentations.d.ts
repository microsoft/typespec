import type { HttpAuth } from "@typespec/http";
import type { authSchemeSymbol, credentialSymbol } from "./credential-symbol.js";

declare module "@typespec/compiler" {
  interface ModelProperty {
    [credentialSymbol]?: boolean;
  }

  interface StringLiteral {
    [authSchemeSymbol]?: HttpAuth;
  }
}
