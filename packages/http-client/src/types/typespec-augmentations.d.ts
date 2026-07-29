import { HttpAuth } from "@typespec/http";
import { authSchemeSymbol, credentialSymbol } from "./credential-symbol.js";

declare module "@typespec/compiler" {
  interface ModelProperty {
    [credentialSymbol]?: boolean;
  }

  interface StringLiteral {
    [authSchemeSymbol]?: HttpAuth;
  }
}
