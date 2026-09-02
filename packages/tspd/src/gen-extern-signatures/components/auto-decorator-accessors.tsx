import { code, For, List } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Decorator } from "@typespec/compiler";
import { typespecCompiler } from "../external-packages/compiler.js";
import type { DecoratorSignature } from "../types.js";
import { ParameterTsType, TargetParameterTsType } from "./decorator-signature-type.js";

export interface AutoDecoratorAccessorsProps {
  decorators: DecoratorSignature[];
  namespaceName: string;
}

/**
 * Generate typed accessor functions for auto decorators.
 * These are thin wrappers around the compiler's generic auto decorator API.
 * For each auto decorator both a reader (`is*`/`get*`) and a setter (`set*`)
 * are generated.
 */
export function AutoDecoratorAccessors(props: Readonly<AutoDecoratorAccessorsProps>) {
  return (
    <For each={props.decorators} doubleHardline>
      {(signature) => (
        <AutoDecoratorAccessor signature={signature} namespaceName={props.namespaceName} />
      )}
    </For>
  );
}

interface AutoDecoratorAccessorProps {
  signature: DecoratorSignature;
  namespaceName: string;
}

function AutoDecoratorAccessor(props: Readonly<AutoDecoratorAccessorProps>) {
  return (
    <List doubleHardline>
      <AutoDecoratorReader {...props} />
      <AutoDecoratorSetter {...props} />
    </List>
  );
}

/** Generate the reader (`is*` for no-arg, `get*` for decorators with args). */
function AutoDecoratorReader(props: Readonly<AutoDecoratorAccessorProps>) {
  const decorator = props.signature.decorator;
  const name = decorator.name.slice(1); // remove @
  const capitalizedName = name[0].toUpperCase() + name.slice(1);
  const fqn = props.namespaceName ? `${props.namespaceName}.${name}` : name;
  const params = decorator.parameters;
  const targetType = <TargetParameterTsType type={decorator.target.type.type} />;

  if (params.length === 0) {
    // No-arg auto decorator — generate `is*` function
    return (
      <List hardline>
        <AccessorDoc doc={`Check if the \`@${fqn}\` decorator was applied on the given target.`} />
        <ts.FunctionDeclaration
          export
          name={`is${capitalizedName}`}
          parameters={[
            { name: "program", type: typespecCompiler.Program },
            { name: decorator.target.name, type: targetType },
          ]}
          returnType="boolean"
        >
          {code`return ${typespecCompiler.hasAutoDecorator}(program, "${fqn}", ${decorator.target.name});`}
        </ts.FunctionDeclaration>
      </List>
    );
  }

  // Decorators with args — generate `get*` function
  let returnType;
  let body;
  if (params.length === 1) {
    const param = params[0];
    returnType = (
      <>
        <ParameterTsType constraint={param.type} />
        {" | undefined"}
      </>
    );
    // Single-arg: storage is a uniform record, but the typed accessor unwraps to
    // the bare value to preserve parity with hand-written extern getters.
    body = code`return ${typespecCompiler.getAutoDecoratorValue}(program, "${fqn}", ${decorator.target.name})?.["${param.name}"] as any;`;
  } else {
    // Multi-arg — return type is an interface with named properties
    returnType = (
      <>
        {"{"}
        <For each={params} joiner="; ">
          {(param) => (
            <>
              {" "}
              {param.name}: <ParameterTsType constraint={param.type} />
            </>
          )}
        </For>
        {" } | undefined"}
      </>
    );
    body = code`return ${typespecCompiler.getAutoDecoratorValue}(program, "${fqn}", ${decorator.target.name}) as any;`;
  }

  return (
    <List hardline>
      <AccessorDoc doc={getDocDescription(decorator)} />
      <ts.FunctionDeclaration
        export
        name={`get${capitalizedName}`}
        parameters={[
          { name: "program", type: typespecCompiler.Program },
          { name: decorator.target.name, type: targetType },
        ]}
        returnType={returnType}
      >
        {body}
      </ts.FunctionDeclaration>
    </List>
  );
}

/**
 * Generate the setter (`set*`). Mirrors what the synthesized `auto dec`
 * implementation does when the decorator is written in source, so emitters and
 * mutators can programmatically mark synthetic types.
 */
function AutoDecoratorSetter(props: Readonly<AutoDecoratorAccessorProps>) {
  const decorator = props.signature.decorator;
  const name = decorator.name.slice(1); // remove @
  const capitalizedName = name[0].toUpperCase() + name.slice(1);
  const fqn = props.namespaceName ? `${props.namespaceName}.${name}` : name;
  const params = decorator.parameters;
  const targetType = <TargetParameterTsType type={decorator.target.type.type} />;

  const parameters: { name: string; type: any }[] = [
    { name: "program", type: typespecCompiler.Program },
    { name: decorator.target.name, type: targetType },
  ];

  let body;
  if (params.length === 0) {
    // No-arg auto decorator — the stored record defaults to `{}`.
    body = code`${typespecCompiler.setAutoDecorator}(program, "${fqn}", ${decorator.target.name});`;
  } else if (params.length === 1) {
    // Single-arg: accept the bare value (parity with the `get*` reader) and
    // wrap it into the uniform `{ paramName: value }` storage record.
    const param = params[0];
    parameters.push({ name: param.name, type: <ParameterTsType constraint={param.type} /> });
    body = code`${typespecCompiler.setAutoDecorator}(program, "${fqn}", ${decorator.target.name}, { ${param.name}: ${param.name} });`;
  } else {
    // Multi-arg: accept the whole `{ paramName: value }` record.
    const valueType = (
      <>
        {"{ "}
        <For each={params} joiner="; ">
          {(param) => (
            <>
              {param.name}: <ParameterTsType constraint={param.type} />
            </>
          )}
        </For>
        {" }"}
      </>
    );
    parameters.push({ name: "value", type: valueType });
    body = code`${typespecCompiler.setAutoDecorator}(program, "${fqn}", ${decorator.target.name}, value);`;
  }

  return (
    <List hardline>
      <AccessorDoc doc={getDocDescription(decorator)} />
      <ts.FunctionDeclaration
        export
        name={`set${capitalizedName}`}
        parameters={parameters}
        returnType="void"
      >
        {body}
      </ts.FunctionDeclaration>
    </List>
  );
}

/**
 * Render a doc comment for an accessor.
 *
 * The comment is rendered standalone rather than through the `doc` prop of
 * `ts.FunctionDeclaration`, because that also emits `@param {Type}` tags whose type references count
 * as value usages and would turn the type-only imports of this file into value imports.
 */
function AccessorDoc(props: Readonly<{ doc: string | undefined }>) {
  if (props.doc === undefined) {
    return null;
  }
  const lines = props.doc.split("\n");
  const comment =
    lines.length === 1
      ? `/** ${lines[0]} */`
      : [`/**`, ...lines.map((line) => ` * ${line}`.trimEnd()), ` */`].join("\n");
  return <>{comment}</>;
}

/**
 * Get the description of a decorator, excluding any doc tag.
 *
 * Only the description is carried over: the `@param` tags of the decorator describe its TypeSpec
 * parameters, which do not line up with the accessor signatures.
 */
function getDocDescription(decorator: Decorator): string | undefined {
  const docs = decorator.node?.docs;
  if (docs === undefined || docs.length === 0) {
    return undefined;
  }

  const lines: string[] = [];
  for (const doc of docs) {
    for (const content of doc.content) {
      for (const line of content.text.split("\n")) {
        // Issue to escape @internal and other tsdoc tags https://github.com/microsoft/TypeScript/issues/47679
        lines.push(line.replaceAll("@internal", "@_internal"));
      }
    }
  }

  const description = lines.join("\n").trim();
  return description === "" ? undefined : description;
}
