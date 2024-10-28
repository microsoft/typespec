import { refkey as getRefkey } from "@alloy-js/core";
import { ParameterDescriptor, Reference } from "@alloy-js/typescript";
import { Interface, Namespace } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";
import { ClientContextRefkey, ClientOptionsRefkey } from "../components/client-context.jsx";

export function getClientParams(
  type: Namespace | Interface,
  options?: { isClientlet?: boolean },
): Record<string, ParameterDescriptor> {
  if (options?.isClientlet) {
    return { context: <Reference refkey={ClientContextRefkey} /> };
  }

  if (type.kind === "Interface") {
    return {};
  }

  const server = getServers($.program, type)?.[0];
  const clientParameters: Record<string, ParameterDescriptor> = {};
  // If there is no URL defined we make it a required parameter
  if (!server?.url) {
    clientParameters["endpoint"] = { type: "string", refkey: getRefkey("endpoint") };
  }

  clientParameters["options"] = {
    optional: true,
    type: <Reference refkey={ClientOptionsRefkey } />,
    refkey: getRefkey("client.options"),
  };

  return clientParameters;
}
