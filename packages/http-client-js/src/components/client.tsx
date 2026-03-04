import { For, List, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { type Typekit } from "@typespec/compiler/typekit";
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

/**
 * Returns a stable refkey for a private stored-parameter field on the parent client.
 * These stored fields are used by subclient accessor methods to pass shared parameters.
 */
function getStoredParamFieldRef(parentClient: cl.Client, paramName: string): Refkey {
  return refkey(parentClient.type, `stored-${paramName}`);
}

/**
 * Returns the set of parameter names that are shared between a parent client and a subclient,
 * where "shared" means the parameter has the same name AND the same TypeSpec type in both clients.
 * Options parameters are excluded.
 */
function getCompatibleSharedParamNames(
  tk: Typekit,
  parentClient: cl.Client,
  subClient: cl.Client,
): Set<string> {
  const parentConstructor = tk.client.getConstructor(parentClient);
  const parentParams = tk.operation.getClientSignature(parentClient, parentConstructor);
  const parentParamsByName = new Map(parentParams.map((p) => [p.name, p]));

  const subClientConstructor = tk.client.getConstructor(subClient);
  const subClientParams = tk.operation.getClientSignature(subClient, subClientConstructor);

  const shared = new Set<string>();
  for (const sp of subClientParams) {
    if (sp.name === "options") continue;
    const pp = parentParamsByName.get(sp.name);
    // Only treat as shared if the TypeSpec type is the same object (identity check)
    if (pp && pp.type === sp.type) {
      shared.add(sp.name);
    }
  }
  return shared;
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

  // Subclients with different constructors need accessor methods instead of fields
  const diffConstrSubClients = subClients.filter(
    (sc) => !$.client.haveSameConstructor(sc, props.client),
  );

  return (
    <ts.ClassDeclaration export name={clientName} refkey={clientClassRef}>
      <List hardline>
        <ts.ClassField
          name="context"
          jsPrivate
          refkey={contextMemberRef}
          type={contextDeclarationRef}
        />
        {/* Private stored-parameter fields used by subclient accessor methods */}
        <StoredParamFields client={props.client} diffConstrSubClients={diffConstrSubClients} />
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
        {/* Accessor methods for subclients with different constructor parameters */}
        <For each={diffConstrSubClients} hardline semicolon>
          {(subClient) => (
            <SubClientAccessorMethod subClient={subClient} parentClient={props.client} />
          )}
        </For>
      </List>
    </ts.ClassDeclaration>
  );
}

interface StoredParamFieldsProps {
  client: cl.Client;
  diffConstrSubClients: cl.Client[];
}

/**
 * Renders private class fields for each constructor parameter that is shared between the parent
 * client and any of its different-constructor subclients. These stored fields are referenced by
 * the subclient accessor methods.
 */
function StoredParamFields(props: StoredParamFieldsProps) {
  const { $ } = useTsp();
  const parentParams = buildClientParameters(props.client, refkey());

  // Collect unique shared param names/types across all different-constructor subclients
  const storedParamMap = new Map<string, ts.ParameterDescriptor>();
  for (const subClient of props.diffConstrSubClients) {
    const sharedNames = getCompatibleSharedParamNames($, props.client, subClient);
    for (const name of sharedNames) {
      if (!storedParamMap.has(name)) {
        const parentParam = parentParams.find((pp) => String(pp.name) === name);
        if (parentParam) {
          storedParamMap.set(name, parentParam);
        }
      }
    }
  }

  const storedParams = [...storedParamMap.values()];

  return (
    <For each={storedParams} hardline semicolon>
      {(param) => (
        <ts.ClassField
          name={String(param.name)}
          jsPrivate
          refkey={getStoredParamFieldRef(props.client, String(param.name))}
          type={param.type}
        />
      )}
    </For>
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
  // Subclients with different constructor parameters are exposed as accessor methods instead
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
  const diffConstrSubClients = props.client.subClients.filter(
    (sc) => !$.client.haveSameConstructor(sc, props.client),
  );
  const clientContextFieldRef = getClientContextFieldRef(props.client);
  const clientContextFactoryRef = getClientContextFactoryRef(props.client);
  const constructorParameters = buildClientParameters(props.client, refkey());
  const args = Object.values(constructorParameters).map((p) => p.refkey);

  // Compute the stored params needed for different-constructor subclient accessor methods
  const storedParamNames = new Set<string>();
  for (const subClient of diffConstrSubClients) {
    const sharedNames = getCompatibleSharedParamNames($, props.client, subClient);
    for (const name of sharedNames) {
      storedParamNames.add(name);
    }
  }
  const storedParamAssignments = [...storedParamNames].map((name) => {
    const parentParam = constructorParameters.find((p) => String(p.name) === name)!;
    return {
      name,
      storedRef: getStoredParamFieldRef(props.client, name),
      paramRef: parentParam.refkey,
    };
  });

  return (
    <ts.ClassMethod name="constructor" parameters={constructorParameters}>
      {clientContextFieldRef} ={" "}
      <ts.FunctionCallExpression target={clientContextFactoryRef} args={args} />;<br />
      <For each={storedParamAssignments} joiner=";" hardline>
        {(assignment) => (
          <>
            {assignment.storedRef} = {assignment.paramRef};
          </>
        )}
      </For>
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

interface SubClientAccessorMethodProps {
  subClient: cl.Client;
  parentClient: cl.Client;
}

/**
 * Renders an accessor method for a subclient whose constructor parameters differ from the parent.
 * The method takes the subclient's extra parameters (those not shared with the parent) and uses
 * the parent's stored shared parameters to construct and return the subclient.
 */
function SubClientAccessorMethod(props: SubClientAccessorMethodProps) {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();

  const accessorSuffixRefkey = refkey();
  const subClientParams = buildClientParameters(props.subClient, accessorSuffixRefkey);

  // Shared params: same name AND same TypeSpec type in both parent and subclient
  const sharedParamNames = getCompatibleSharedParamNames($, props.parentClient, props.subClient);

  // Extra params (only in subclient or different type) and the options param → accessor method parameters
  const accessorMethodParams = subClientParams.filter((p) => !sharedParamNames.has(String(p.name)));

  // Build the argument list for `new SubClient(...)` following the subclient's constructor order
  const subClientConstructorArgs: Refkey[] = subClientParams.flatMap((p) => {
    const paramName = String(p.name);
    if (paramName === "options") {
      const optionsParam = accessorMethodParams.find((ap) => String(ap.name) === "options");
      return optionsParam?.refkey ? optionsParam.refkey : [];
    } else if (sharedParamNames.has(paramName)) {
      return [getStoredParamFieldRef(props.parentClient, paramName)];
    } else {
      const methodParam = accessorMethodParams.find((ap) => String(ap.name) === paramName);
      return methodParam?.refkey ? methodParam.refkey : [];
    }
  });

  const methodName = namePolicy.getName($.client.getName(props.subClient), "class");

  return (
    <ts.ClassMethod name={methodName} parameters={accessorMethodParams}>
      return <NewClientExpression client={props.subClient} args={subClientConstructorArgs} />;
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
