import { refkey as getRefkey, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Namespace, Operation, Service } from "@typespec/compiler";
import { ClassMethod } from "@typespec/emitter-framework/typescript";
import { getClientParams } from "../utils/client.js";
import { prepareOperation } from "../utils/operations.js";
import { ClientContextFactoryRefkey, ClientContextRefkey } from "./client-context.jsx";

export interface ClientFileProps {
  name?: string;
  service?: Service;
}

export function ClientFile(props: ClientFileProps) {
  if (!props.service) {
    return null;
  }

  const clientlets = getClientlets(props.service.type);

  return <ts.SourceFile path="client.ts"> 
    <Client namespace={props.service.type} />
    {mapJoin(clientlets, (namespace) => <Client clientlet namespace={namespace} />, {joiner: "\n\n"})}
  </ts.SourceFile>;
}

function getClientlets(rootNamespace: Namespace): Namespace[] {
  const clientlets = new Set<Namespace>();
  const stack = [...rootNamespace.namespaces.values()];
  while (stack.length > 0) {
    const namespace = stack.pop();
    if (!namespace) {
      continue;
    }

    if (namespace.operations.size > 0) {
      clientlets.add(namespace);
    }

    for (const child of namespace.namespaces.values()) {
      stack.push(child);
    }
  }
  return Array.from(clientlets);
}

export interface ClientProps {
  name?: string;
  clientlet?: boolean;
  namespace: Namespace;
}

export function Client(props: ClientProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = props.name ?? props.namespace.name;
  const className = namePolicy.getName(`${name}Client`, "class");
  const methods = props.namespace.operations;
  const clientlets = getClientlets(props.namespace);
  const clientParameters = getClientParams(props.namespace, { isClientlet: props.clientlet });
  const paramsInit = Object.keys(clientParameters);
  const thisContext = refkey();

  const contextInit = props.clientlet ? (
    <><ts.Reference refkey={thisContext} /> = context</>
  ) : (
    <> <ts.Reference refkey={thisContext} /> = <ts.FunctionCallExpression refkey={ClientContextFactoryRefkey} args={paramsInit} /></>
  );

  return <ts.ClassDeclaration export name={className} refkey={getClientletClassRefkey(props.namespace)}>
  {mapJoin(clientlets, (namespace) => <ClientletField namespace={namespace} />, {joiner: "\n"})}
  <ts.ClassField name="context" jsPrivate={true} refkey={thisContext} type={<ts.Reference refkey={ClientContextRefkey} />}/>
    <ts.ClassMethod name="constructor" parameters={clientParameters}>
     {contextInit}
      {mapJoin(clientlets, (namespace) => {
        return <>
          <ts.Reference refkey={getClientletFieldRefkey(namespace)} /> = new <ts.Reference refkey={getClientletClassRefkey(namespace)} />({thisContext});
        </>
      }, {joiner: "\n"})}
    </ts.ClassMethod>
    <OperationClassMethods operations={methods} />
</ts.ClassDeclaration>;
}

export interface ClientletFieldProps {
  namespace: Namespace;
}

export function ClientletField(props: ClientletFieldProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(props.namespace.name, "class");
  const refkey = getClientletClassRefkey(props.namespace);
  return <ts.ClassField 
    name={name} 
    type={<ts.Reference refkey={refkey}/>}
    refkey={getClientletFieldRefkey(props.namespace)} />;
}

function getClientletClassRefkey(namespace: Namespace) {
  return getRefkey(namespace, "client");
}

function getClientletFieldRefkey(namespace: Namespace) {
  return getRefkey(namespace, "field");
}

export interface ClientMethodsProps {
  operations: Map<string, Operation>;
}

export function OperationClassMethods(props: ClientMethodsProps) {
  return mapJoin(
    props.operations,
    (_name, operation) => {
      const preparedOperation = prepareOperation(operation);
      const args = [...preparedOperation.parameters.properties.keys()];
      return <ClassMethod type={preparedOperation} returnType="">
      return <ts.FunctionCallExpression refkey={getRefkey(preparedOperation)} args={["this.#context", ...args]}/>;
    </ClassMethod>;
    },
    { joiner: "\n\n" },
  );
}
