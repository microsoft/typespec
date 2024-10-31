import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";
import { Client } from "../interfaces.js";

export function addEndpointParameter(client: Client, base: Model): undefined {
  const servers = getServers($.program, client.service);
  if (servers === undefined) {
    const name = "endpoint";
    base.properties.set(
      name,
      $.modelProperty.create({
        name,
        type: $.program.checker.getStdType("string"),
        optional: false,
      }),
    );
  } else {
    for (const server of servers) {
      // TODO: Remove, added to avoid eslint error
      console.log(server.url);
    }
  }
}

// export function addCredentialParameter(client: Client, base: Model): undefined {
//   const schemes = getAuthentication($.program, client.service)?.options.flatMap((o) => o.schemes);
//   if (!schemes) return;
//   const credTypes: (Type | ReferencedType)[] = schemes.forEach((scheme) => {
//     switch (scheme.type) {
//       case "apiKey":
//         return {
//           kind: "ReferencedType",
//           name: "KeyCredential",
//           library: "@typespec/ts-http-runtime",
//         }
//       case "oauth2":
//         return {
//           kind: "ReferencedType",
//           name: "OAuth2Credential",
//           library: "@typespec/ts-http-runtime",
//         }
//       default:
//         return $.program.checker.getStdType("string");
//     }
//   });
//   let credType: Type;
//   if (credTypes.length === 1) {
//     credType = credTypes[0];
//   } else {
//     credType = $.union.create({ variants: credTypes });
//   }
//   base.properties.set("credential", credType);
// }
