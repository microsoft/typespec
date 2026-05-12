import { Program } from "@typespec/compiler";
import { createTCGCContext } from "./context.js";
import { validateClients } from "./validations/clients.js";
import { validateHttp } from "./validations/http.js";
import { validateMethods } from "./validations/methods.js";
import { validatePackage } from "./validations/package.js";
import { validateTypes } from "./validations/types.js";

export function $onValidate(program: Program) {
  const tcgcContext = createTCGCContext(program, "@typespec/http-client-generator-core", {
    mutateNamespace: false,
  });

  validatePackage(tcgcContext);
  validateClients(tcgcContext);
  validateMethods(tcgcContext);
  validateHttp(tcgcContext);
  validateTypes(tcgcContext);
}
