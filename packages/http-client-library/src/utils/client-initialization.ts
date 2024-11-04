import { Model, StringLiteral, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getAuthentication, getServers } from "@typespec/http";
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

export function addCredentialParameter(client: Client, base: Model): undefined {
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
  const credential = $.modelProperty.create({
    name: "credential",
    type: credType,
  });
  base.properties.set("credential", credential);
}
