import { For, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTransformNamePolicy, useTsp } from "@typespec/emitter-framework";
import { TypeExpression } from "@typespec/emitter-framework/typescript";
import type * as cl from "@typespec/http-client";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

export interface ClientContextOptionsDeclarationProps {
  client: cl.Client;
}

export function getClientContextOptionsRef(client: cl.Client) {
  return refkey(client, "options");
}

export function ClientContextOptionsDeclaration(props: ClientContextOptionsDeclarationProps) {
  const { $ } = useTsp();
  const ref = getClientContextOptionsRef(props.client);
  const namePolicy = ts.useTSNamePolicy();
  const propNamer = useTransformNamePolicy();
  const name = namePolicy.getName(`${props.client.name}Options`, "interface");
  const optionalEndpointParameters = $.client
    .getUrlTemplate(props.client)
    .parameters.filter((parameter) => parameter.optional || parameter.defaultValue !== undefined);

  return (
    <ts.InterfaceDeclaration
      export
      name={name}
      refkey={ref}
      extends={<ts.Reference refkey={httpRuntimeTemplateLib.ClientOptions} />}
    >
      <For each={optionalEndpointParameters} semicolon line>
        {(parameter) => (
          <ts.InterfaceMember
            optional
            name={propNamer.getApplicationName(parameter)}
            type={<TypeExpression type={parameter.type} />}
          />
        )}
      </For>
    </ts.InterfaceDeclaration>
  );
}
