import { ModelProperty, StringLiteral, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getAuthentication, getServers } from "@typespec/http";
import { Client } from "../interfaces.js";

/**
 * Returns endpoint parameters, grouped by constructor. Meaning, each constructor will have its own set of parameters.
 * @param client
 * @returns
 */
export function getEndpointParametersPerConstructor(client: Client): ModelProperty[][] {
  const servers = getServers($.program, client.service);
  if (servers === undefined) {
    const name = "endpoint";
    return [
      [
        $.modelProperty.create({
          name,
          type: $.program.checker.getStdType("string"),
          optional: false,
        }),
      ],
    ];
  }
  const retval: ModelProperty[][] = [];
  for (const server of servers) {
    const overridingEndpointConstructor: ModelProperty[] = [];
    // add a parameter for each server, this is where users can override and pass in the full server
    overridingEndpointConstructor.push(
      $.modelProperty.create({
        name: "endpoint",
        type: $.literal.createString(server.url),
        optional: false,
      }),
    );
    retval.push(overridingEndpointConstructor);
    const formattingServerUrlConstructor: ModelProperty[] = [];
    for (const param of server.parameters.values()) {
      formattingServerUrlConstructor.push(
        $.modelProperty.create({
          name: param.name,
          type: param.type,
          optional: param.optional,
        }),
      );
    }
    if (formattingServerUrlConstructor.length > 0) {
      retval.push(formattingServerUrlConstructor);
    }
  }
  return retval;
}

export function getCredentalParameter(client: Client): ModelProperty | undefined {
  const schemes = getAuthentication($.program, client.service)?.options.flatMap((o) => o.schemes);
  if (!schemes) return;
  const credTypes: StringLiteral[] = schemes.map((scheme) => {
    return $.literal.createString(scheme.type);
  });
  let credType: Type;
  if (credTypes.length === 1) {
    credType = credTypes[0];
  } else {
    const variants = credTypes.map((v) => $.unionVariant.create({ name: v.value, type: v }));
    credType = $.union.create({ variants });
  }
  return $.modelProperty.create({
    name: "credential",
    type: credType,
  });
}
