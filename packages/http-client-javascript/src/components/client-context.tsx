import { Children, code, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";

export interface ClientContextProps {
  service?: Service;
}

export function ClientContext(props: ClientContextProps): Children {
  if (!props.service) {
    return null;
  }

  const namePolicy = ts.useTSNamePolicy();
  const serviceName = namePolicy.getName(props.service.type.name, "interface");
  const contextInterface = ts.useTSNamePolicy().getName( `${serviceName}Context`, "interface");
  const factoryFunctionName = namePolicy.getName(`create${serviceName}Context`, "function");
  const clientOptionsName = namePolicy.getName(`${serviceName}Options`, "interface");

  const servers = getServers($.program, props.service.type);

  const server = servers?.[0];
  const clientParameters: Record<string, ts.ParameterDescriptor> = {};
  const clientOptions: Map<string, Children> = new Map();
  const bodyVars: Map<string, Children> = new Map();

  // If there is no URL defined we make it a required parameter
  if (!server?.url) {
    clientParameters["endpoint"] = { type: "string", refkey: refkey("endpoint") };
  } else {
    // When there is a URL defined for the service, we need to allow client options to override it.
    clientOptions.set("endpoint",  "string");
    // Apply the override in the factory function
    bodyVars.set("endpoint", code`options.endpoint ?? "${server.url}"`);

  }

  clientParameters["options"] = { type: clientOptionsName, refkey: getClientOptionsRefkey(props.service) };
  const clientContextInterfaceRefkey = getClientContextRefkey(props.service)
  return (
    <ts.SourceFile path="clientContext.ts">
      <ts.InterfaceDeclaration export name={contextInterface} refkey={clientContextInterfaceRefkey}>
        {server?.url ? null : <ts.InterfaceMember name="endpoint" type="string" />}
      </ts.InterfaceDeclaration>
      <ts.InterfaceDeclaration export name={clientOptionsName} refkey={getClientOptionsRefkey(props.service)}>
        {mapJoin(clientOptions, (key, value) => (
          <ts.InterfaceMember optional name={key} type={value} />
        ), { joiner: ";\n" })}
        <ts.InterfaceMember optional name="endpoint" type="string" />
      </ts.InterfaceDeclaration>

      <ts.FunctionDeclaration
        export
        name={factoryFunctionName}
        parameters={clientParameters}
        returnType={<ts.Reference refkey={clientContextInterfaceRefkey} />}
        refkey={getClientContextFactoryRefkey(props.service)}
      >
        {mapJoin(bodyVars, (key, value) => {
          return <ts.VarDeclaration name={key} value={value} />;
        }, { joiner: ";\n" })}
        {code`return { 
          endpoint 
        };`}
      </ts.FunctionDeclaration>
    </ts.SourceFile>
  );
}

function getClientOptionsRefkey(service: Service) {
  return refkey(service.type, "clientOptions");
}

export function getClientContextFactoryRefkey(service: Service) {
  return refkey(service.type, "clientContextFactory");
}

export function getClientContextRefkey(service: Service) {
  return refkey(service.type, "clientContext");
}
