import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ClassDeclaration } from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import { ClassMethod } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
import { useClientLibrary } from "@typespec/http-client-library";
import { flattenClients } from "../utils/client-discovery.js";
import { buildClientParameters } from "../utils/parameters.jsx";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { getClientContextFactoryRef } from "./client-context/client-context-factory.jsx";

export interface ClientProps {}

export function Client(props: ClientProps) {
  const { rootClient: client } = useClientLibrary();
  const namePolicy = ts.useTSNamePolicy();
  const fileName = namePolicy.getName(`${client.name}`, "variable");
  const clients = flattenClients(client);
  return <ts.SourceFile path={`${fileName}.ts`} >
    {ay.mapJoin(clients, (client) => <ClientClass client={client} />, { joiner: "\n\n" })}
  </ts.SourceFile>;
}

export interface ClientClassProps {
  client: cl.Client;
}

export function getClientClassRef(client: cl.Client) {
  return ay.refkey(client.type, "client-class");
}

function getClientContextFieldRef(client: cl.Client) {
  return ay.refkey(client.type, "client-context");
}
export function ClientClass(props: ClientClassProps) {
  const namePolicy = ts.useTSNamePolicy();
  const clientName = namePolicy.getName($.client.getName(props.client), "class");
  const contextMemberRef = getClientContextFieldRef(props.client);
  const contextDeclarationRef = getClientcontextDeclarationRef(props.client);
  const clientClassRef = getClientClassRef(props.client);
  const subClients = props.client.subClients;
  const operations = props.client.operations;
  return <ClassDeclaration export name={clientName} refkey={clientClassRef}>
    <ts.ClassField name="context" jsPrivate refkey={contextMemberRef} type={contextDeclarationRef} />;
    {ay.mapJoin(subClients, subClient => (
      <SubClientClassField client={subClient} />
    ), { joiner: "\n" })}
    <ClientConstructor client={props.client} />
    {ay.mapJoin(operations, ({operation: op}) => {
      const args = [...op.parameters.properties.values()].map(p => ay.refkey(p));
      return <ClassMethod async type={op} returnType={null}>
          return <ts.FunctionCallExpression refkey={ay.refkey(op)} args={[contextMemberRef, ...args]}/>;
      </ClassMethod>
    })}
  </ClassDeclaration>;
}

interface SubClientClassFieldProps {
  client: cl.Client;
}

function getSubClientClassFieldRef(client: cl.Client) {
  return ay.refkey(client.type, "client-field");
}

function SubClientClassField(props: SubClientClassFieldProps) {
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
  const subClients = props.client.subClients.filter((sc) =>
    $.client.haveSameConstructor(sc, props.client));
  const clientContextFieldRef = getClientContextFieldRef(props.client);
  const clientContextFactoryRef = getClientContextFactoryRef(props.client);
  const constructorParameters = buildClientParameters(props.client);
  const args = Object.values(constructorParameters).map((p) => p.refkey);

  return <ts.ClassMethod name="constructor" parameters={constructorParameters}>
    {clientContextFieldRef} = <ts.FunctionCallExpression refkey={clientContextFactoryRef}  args={args}/>;
    {ay.mapJoin(subClients, subClient => {
      const subClientFieldRef = getSubClientClassFieldRef(subClient);
      const subClientArgs = calculateSubClientArgs(subClient, constructorParameters);
      return <>
        {subClientFieldRef} = <NewClientExpression client={subClient} args={subClientArgs}/>;
      </>
    }, {joiner: "\n"})}
  </ts.ClassMethod>;
}

function calculateSubClientArgs(
  subClient: cl.Client,
  parentParams: Record<string, ts.ParameterDescriptor>,
) {
  const subClientParams = buildClientParameters(subClient);
  return Object.entries(parentParams)
    .filter(([name]) => Object.keys(subClientParams).includes(name))
    .map(([_, p]) => p.refkey);
}

export interface NewClientExpressionProps {
  client: cl.Client;
  args: ay.Refkey[];
}

function NewClientExpression(props: NewClientExpressionProps) {
  const clientConstructorRef = getClientClassRef(props.client);

  return <>
    new <ts.FunctionCallExpression refkey={clientConstructorRef} args={props.args} />
  </>;
}
