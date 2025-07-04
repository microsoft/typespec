import { For, List, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTsp } from "@typespec/emitter-framework";
import { ClassMethod } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client";
import { useClientLibrary } from "@typespec/http-client";
import { flattenClients } from "../utils/client-discovery.js";
import { buildClientParameters } from "../utils/parameters.jsx";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { getClientContextFactoryRef } from "./client-context/client-context-factory.jsx";
import { getOperationParameters } from "./operation-parameters.jsx";

export interface ClientProps {}

export function Client(props: ClientProps) {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();
  const { topLevel } = useClientLibrary();

  return (
    <For each={topLevel} hardline>
      {(client) => {
        const fileName = namePolicy.getName($.client.getName(client), "variable");
        const flatClients = flattenClients(client);
        return (
          <ts.SourceFile path={`${fileName}.ts`}>
            <For each={flatClients} hardline>
              {(client) => <ClientClass client={client} />}
            </For>
          </ts.SourceFile>
        );
      }}
    </For>
  );
}

export interface ClientClassProps {
  client: cl.Client;
}

export function getClientClassRef(client: cl.Client) {
  return refkey(client.type, "client-class");
}

function getClientContextFieldRef(client: cl.Client) {
  return refkey(client.type, "client-context");
}
export function ClientClass(props: ClientClassProps) {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();
  const clientName = namePolicy.getName($.client.getName(props.client), "class");
  const contextMemberRef = getClientContextFieldRef(props.client);
  const contextDeclarationRef = getClientcontextDeclarationRef(props.client);
  const clientClassRef = getClientClassRef(props.client);
  const subClients = props.client.subClients;
  const operations = props.client.operations;
  return (
    <ts.ClassDeclaration export name={clientName} refkey={clientClassRef}>
      <List hardline>
        <ts.ClassField
          name="context"
          jsPrivate
          refkey={contextMemberRef}
          type={contextDeclarationRef}
        />
        <For each={subClients} hardline semicolon>
          {(subClient) => <SubClientClassField client={subClient} />}
        </For>
        <ClientConstructor client={props.client} />
        <For each={operations} hardline semicolon>
          {(op) => {
            const parameters = getOperationParameters(op.httpOperation, refkey());
            const args = parameters.flatMap((p) => p.refkey);
            const isPaging = Boolean($.operation.getPagingMetadata(op.httpOperation.operation));

            return (
              <ClassMethod
                async={!isPaging}
                type={op.httpOperation.operation}
                parameters={parameters}
                returnType={null}
                parametersMode="replace"
              >
                return{" "}
                <ts.FunctionCallExpression
                  target={refkey(op.httpOperation.operation)}
                  args={[contextMemberRef, ...args]}
                />
                ;
              </ClassMethod>
            );
          }}
        </For>
      </List>
    </ts.ClassDeclaration>
  );
}

interface SubClientClassFieldProps {
  client: cl.Client;
}

function getSubClientClassFieldRef(client: cl.Client) {
  return refkey(client.type, "client-field");
}

function SubClientClassField(props: SubClientClassFieldProps) {
  const { $ } = useTsp();
  const parent = props.client.parent;
  // If sub client has different parameters than client, don't add it as a subclass field
  // Todo: We need to detect the extra parameters and make this field a factory for the subclient
  if (parent && !$.client.haveSameConstructor(props.client, parent)) {
    return null;
  }

  const namePolicy = ts.useTSNamePolicy();
  const fieldName = namePolicy.getName($.client.getName(props.client), "class");
  const subClientClassRef = getClientClassRef(props.client);
  const subClientFieldRef = getSubClientClassFieldRef(props.client);
  return <ts.ClassField name={fieldName} type={subClientClassRef} refkey={subClientFieldRef} />;
}

interface ClientConstructorProps {
  client: cl.Client;
}

function ClientConstructor(props: ClientConstructorProps) {
  const { $ } = useTsp();
  const subClients = props.client.subClients.filter((sc) =>
    $.client.haveSameConstructor(sc, props.client),
  );
  const clientContextFieldRef = getClientContextFieldRef(props.client);
  const clientContextFactoryRef = getClientContextFactoryRef(props.client);
  const constructorParameters = buildClientParameters(props.client, refkey());
  const args = Object.values(constructorParameters).map((p) => p.refkey);

  return (
    <ts.ClassMethod name="constructor" parameters={constructorParameters}>
      {clientContextFieldRef} ={" "}
      <ts.FunctionCallExpression target={clientContextFactoryRef} args={args} />;<br />
      <For each={subClients} joiner=";" hardline>
        {(subClient) => {
          const subClientFieldRef = getSubClientClassFieldRef(subClient);
          const subClientArgs = calculateSubClientArgs(subClient, constructorParameters);
          return (
            <>
              {subClientFieldRef} = <NewClientExpression client={subClient} args={subClientArgs} />;
            </>
          );
        }}
      </For>
    </ts.ClassMethod>
  );
}

function calculateSubClientArgs(subClient: cl.Client, parentParams: ts.ParameterDescriptor[]) {
  const subClientParams = buildClientParameters(subClient, refkey()).map((p) => p.name);
  return parentParams
    .filter(({ name }) => subClientParams.includes(name))
    .flatMap((p) => (p.refkey ? p.refkey : []));
}

export interface NewClientExpressionProps {
  client: cl.Client;
  args: Refkey[];
}

function NewClientExpression(props: NewClientExpressionProps) {
  const clientConstructorRef = getClientClassRef(props.client);

  return (
    <>
      new <ts.FunctionCallExpression target={clientConstructorRef} args={props.args} />
    </>
  );
}
