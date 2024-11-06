import { ModelProperty, StringLiteral, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getAuthentication } from "@typespec/http";
import { Client } from "../interfaces.js";

export function addEndpointParameter(client: Client): ModelProperty {
  // const servers = getServers($.program, client.service);
  // if (servers === undefined) {
  //   const name = "endpoint";
  //   return $.modelProperty.create({
  //     name,
  //     type: $.program.checker.getStdType("string"),
  //     optional: false,
  //   });
  // } else {
  //   for (const server of servers) {
  //     // TODO: Remove, added to avoid eslint error
  //     console.log(server.url);
  //   }
  // }
  return $.modelProperty.create({
    name: "endpoint",
    type: $.program.checker.getStdType("string"),
    optional: false,
  });
}

export function addCredentialParameter(client: Client): ModelProperty | undefined {
  const schemes = getAuthentication($.program, client.service)?.options.flatMap((o) => o.schemes);
  if (!schemes) return;
  const credTypes: StringLiteral[] = schemes.map((scheme) => {
    return $.literal.create(scheme.type) as StringLiteral;
  });
  let credType: Type;
  if (credTypes.length === 1) {
    credType = credTypes[0];
  } else {
    const variants = credTypes.map((v) => $.unionVariant.create({ name: v.value, type: v }));
    credType = $.union.create({ name: "CredentialUnion", variants });
  }
  return $.modelProperty.create({
    name: "credential",
    type: credType,
  });
}
