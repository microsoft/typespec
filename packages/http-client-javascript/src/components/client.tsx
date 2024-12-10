import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ClassDeclaration } from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import { ClassMethod } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
import { prepareOperation } from "../utils/operations.js";
import { buildClientParameters } from "../utils/parameters.jsx";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { getClientContextFactoryRef } from "./client-context/client-context-factory.jsx";

export interface ClientProps {
  client: cl.Client;
}

export function Client(props: ClientProps) {
  if (!props.client) {
    return null;
  }

  const clients = $.client.flat(props.client);
  return <ts.SourceFile path="client.ts" >
    {ay.mapJoin(clients, (client) => <ClientClass client={client} />, { joiner: "\n\n" })}
  </ts.SourceFile>;
}

export interface ClientClassProps {
  client: cl.Client;
}

export function getClientClassRef(client: cl.Client) {
  const refkey = ay.refkey(client.type, "client-class");
  return {
    key: refkey,
    component: <ts.Reference refkey={refkey} />,
  };
}

function getClientContextFieldRef(client: cl.Client) {
  const refkey = ay.refkey(client.type, "client-context");
  return {
    key: refkey,
    component: <ts.Reference refkey={refkey} />,
  };
}
export function ClientClass(props: ClientClassProps) {
  const namePolicy = ts.useTSNamePolicy();
  const clientName = namePolicy.getName($.client.getName(props.client), "class");
  const contextMemberRef = getClientContextFieldRef(props.client).key;
  const contextDeclarationRef = getClientcontextDeclarationRef(props.client);
  const clientClassRef = getClientClassRef(props.client);
  const subClients = $.clientLibrary.listClients(props.client);
  const operations = $.client.listServiceOperations(props.client);
  return <ClassDeclaration export name={clientName} refkey={clientClassRef.key}>
    <ts.ClassField name="context" jsPrivate refkey={contextMemberRef} type={contextDeclarationRef.component} />;
    {ay.mapJoin(subClients, subClient => (
      <SubClientClassField client={subClient} />
    ), { joiner: "\n" })}
    <ClientConstructor client={props.client} />
    {ay.mapJoin(operations, op => {
      const clientOperation = prepareOperation(op);
      const args = [...clientOperation.parameters.properties.keys()];
      return <ClassMethod async type={clientOperation} returnType={null}>
          return <ts.FunctionCallExpression refkey={ay.refkey(clientOperation)} args={["this.#context", ...args]}/>;
      </ClassMethod>
    })}
  </ClassDeclaration>;
}

interface SubClientClassFieldProps {
  client: cl.Client;
}

function getSubClientClassFieldRef(client: cl.Client) {
  const refkey = ay.refkey(client.type, "client-field");
  return {
    key: refkey,
    component: <ts.Reference refkey={refkey} />,
  };
}

function SubClientClassField(props: SubClientClassFieldProps) {
  const namePolicy = ts.useTSNamePolicy();
  const fieldName = namePolicy.getName($.client.getName(props.client), "class");
  const subClientClassRef = getClientClassRef(props.client);
  const subClientFieldRef = getSubClientClassFieldRef(props.client);
  return <ts.ClassField name={fieldName} type={subClientClassRef.component} refkey={subClientFieldRef.key} />;
}

interface ClientConstructorProps {
  client: cl.Client;
}

function getClientConstructorRef(client: cl.Client) {
  const refkey = ay.refkey(client.type, "client-constructor");
  return {
    key: refkey,
    component: <ts.Reference refkey={refkey} />,
  };
}

function ClientConstructor(props: ClientConstructorProps) {
  const subClients = $.clientLibrary.listClients(props.client);
  const clientContextFieldRef = getClientContextFieldRef(props.client);
  const clientContextFactoryRef = getClientContextFactoryRef(props.client);
  const constructorParameters = buildClientParameters(props.client);
  const args = Object.keys(constructorParameters);

  return <ts.ClassMethod name="constructor" parameters={constructorParameters}>
    {clientContextFieldRef.component} = <ts.FunctionCallExpression refkey={clientContextFactoryRef.key}  args={args}/>;
    {ay.mapJoin(subClients, subClient => {
      const subClientFieldRef = getSubClientClassFieldRef(subClient);
      return <>
        {subClientFieldRef.component} = <NewClientExpression client={subClient} />;
      </>
    }, {joiner: "\n"})}
  </ts.ClassMethod>;
}

export interface NewClientExpressionProps {
  client: cl.Client;
}

function NewClientExpression(props: NewClientExpressionProps) {
  const clientConstructorRef = getClientClassRef(props.client);
  const clientParams = buildClientParameters(props.client);

  const args = Object.keys(clientParams);

  return <>
    new <ts.FunctionCallExpression refkey={clientConstructorRef.key} args={args} />
  </>;
}
