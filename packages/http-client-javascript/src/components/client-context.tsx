import { Children, code, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";
import { getClientParams } from "../utils/client.js";

export interface ClientContextProps {
  service?: Service;
}

export function ClientContext(props: ClientContextProps): Children {
  if (!props.service) {
    return null;
  }

  return <ts.SourceFile path="clientContext.ts">
      <ClientContextDeclaration service={props.service} />
      <ClientOptionsDeclaration service={props.service} />
      <ClientContextFactoryDeclaration service={props.service} />
  </ts.SourceFile>;
}

interface ClientContextDeclarationProps {
  service: Service;
}

export const ClientContextRefkey = refkey();
function ClientContextDeclaration(props: ClientContextDeclarationProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${getServiceName(props.service)}Context`, "interface");
  return <ts.InterfaceDeclaration export name={name} refkey={ClientContextRefkey}>
  <ts.InterfaceMember name="endpoint" type="string" />
</ts.InterfaceDeclaration>;
}

interface ClientOptionsDeclarationProps {
  service: Service;
}

export const ClientOptionsRefkey = refkey();
function ClientOptionsDeclaration(props: ClientOptionsDeclarationProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${getServiceName(props.service)}Options`, "interface");

  // TODO: Here we will calculate and include all the options that the client can accept
  const clientOptions: Map<string, Children> = new Map();

  return <ts.InterfaceDeclaration export name={name} refkey={ClientOptionsRefkey}>
        {mapJoin(clientOptions, (key, value) => (
          <ts.InterfaceMember optional name={key} type={value} />
        ), { joiner: ";\n" })}
        <ts.InterfaceMember optional name="endpoint" type="string" />
      </ts.InterfaceDeclaration>;
}

interface ClientContextFactoryDeclaration {
  service: Service;
}

export const ClientContextFactoryRefkey = refkey();
function ClientContextFactoryDeclaration(props: ClientContextFactoryDeclaration) {
  const namePolicy = ts.useTSNamePolicy();
  const factoryFunctionName = namePolicy.getName(
    `create${getServiceName(props.service)}Context`,
    "function",
  );

  const servers = getServers($.program, props.service.type);
  const server = servers?.[0];

  const clientParameters = getClientParams(props.service.type);
  const clientVarAssignments: Map<string, Children> = new Map();

  // If there is no URL defined we make it a required parameter
  if (server?.url) {
    // Apply the override in the factory function
    clientVarAssignments.set("endpoint", code`options?.endpoint ?? "${server.url}"`);
  }

  return <ts.FunctionDeclaration
  export
  name={factoryFunctionName}
  parameters={clientParameters}
  returnType={<ts.Reference refkey={ClientContextRefkey} />}
  refkey={ClientContextFactoryRefkey}
>
  {mapJoin(clientVarAssignments, (key, value) => {
    return <ts.VarDeclaration name={key} value={value} />;
  }, { joiner: ";\n" })}
  {code`return { 
    endpoint 
  };`}
</ts.FunctionDeclaration>;
}

function getServiceName(service: Service) {
  const namePolicy = ts.useTSNamePolicy();
  return namePolicy.getName(service.type.name, "interface");
}
