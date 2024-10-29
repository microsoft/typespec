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
