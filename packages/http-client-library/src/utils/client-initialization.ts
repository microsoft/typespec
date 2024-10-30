import { Model, Type } from "@typespec/compiler";
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
  const credTypes: Type[] = schemes.forEach((scheme) => {
    switch (scheme.type) {
      case "apiKey":
        return $.program.checker.getStdType("string");
      case "http":
        return $.program.checker.getStdType("string");
      case "oauth2":
        return $.program.checker.getStdType("string");
    }
  });
}
