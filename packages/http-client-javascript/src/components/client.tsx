import { refkey as getRefkey, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Interface, Namespace, Operation, Service } from "@typespec/compiler";
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
    <Client type={props.service.type} />
    {mapJoin(clientlets, (container) => <Client clientlet type={container} />, {joiner: "\n\n"})}
  </ts.SourceFile>;
}

function getClientlets(rootNamespace: Namespace): (Namespace | Interface)[] {
  const clientlets = new Set<Namespace | Interface>();
  const stack = [...rootNamespace.namespaces.values(), ...rootNamespace.interfaces.values()];
  while (stack.length > 0) {
    const container = stack.pop();
    if (!container) {
      continue;
    }

    if (container.operations.size > 0) {
      clientlets.add(container);
    }

    if (container.kind === "Namespace") {
      stack.push(...container.interfaces.values());
      for (const child of container.namespaces.values()) {
        stack.push(child);
      }
    }
  }
  return Array.from(clientlets);
}

export interface ClientProps {
  name?: string;
  clientlet?: boolean;
  type: Namespace | Interface;
}

export function Client(props: ClientProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = props.name ?? props.type.name;
  const className = namePolicy.getName(`${name}Client`, "class");
  const methods = props.type.operations;
  const clientlets = props.type.kind === "Namespace" ? getClientlets(props.type) : [];
  const clientParameters = getClientParams(props.type, { isClientlet: props.clientlet });
  const paramsInit = Object.keys(clientParameters);
  const thisContext = refkey();

  const contextInit = props.clientlet ? (
    <><ts.Reference refkey={thisContext} /> = context</>
  ) : (
    <> <ts.Reference refkey={thisContext} /> = <ts.FunctionCallExpression refkey={ClientContextFactoryRefkey} args={paramsInit} /></>
  );

  return <ts.ClassDeclaration export name={className} refkey={getClientletClassRefkey(props.type)}>
  {mapJoin(clientlets, (namespace) => <ClientletField type={namespace} />, {joiner: "\n"})}
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
  type: Namespace | Interface;
}

export function ClientletField(props: ClientletFieldProps) {
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(props.type.name, "class");
  const refkey = getClientletClassRefkey(props.type);
  return <ts.ClassField 
    name={name} 
    type={<ts.Reference refkey={refkey}/>}
    refkey={getClientletFieldRefkey(props.type)} />;
}

function getClientletClassRefkey(type: Namespace | Interface) {
  return getRefkey(type, "client");
}

function getClientletFieldRefkey(type: Namespace | Interface) {
  return getRefkey(type, "field");
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
