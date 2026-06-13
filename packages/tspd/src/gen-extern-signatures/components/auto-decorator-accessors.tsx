import { code, For } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";
import { ParameterTsType, TargetParameterTsType } from "./decorator-signature-type.js";

export interface AutoDecoratorAccessorsProps {
  decorators: DecoratorSignature[];
  namespaceName: string;
}

/**
 * Generate typed accessor functions for auto decorators.
 * These are thin wrappers around the compiler's generic auto decorator API.
 */
export function AutoDecoratorAccessors(props: Readonly<AutoDecoratorAccessorsProps>) {
  const autoDecorators = props.decorators.filter((d) => d.isAuto);
  if (autoDecorators.length === 0) {
    return undefined;
  }

  return (
    <For each={autoDecorators} doubleHardline>
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
  const decorator = props.signature.decorator;
  const name = decorator.name.slice(1); // remove @
  const capitalizedName = name[0].toUpperCase() + name.slice(1);
  const fqn = props.namespaceName ? `${props.namespaceName}.${name}` : name;
  const params = decorator.parameters;
  const targetType = <TargetParameterTsType type={decorator.target.type.type} />;

  if (params.length === 0) {
    // No-arg auto decorator — generate `is*` function
    return (
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
    );
  }

  // Decorators with args — generate `get*` function
  let returnType;
  if (params.length === 1) {
    const param = params[0];
    returnType = (
      <>
        <ParameterTsType constraint={param.type} />
        {" | undefined"}
      </>
    );
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
  }

  return (
    <ts.FunctionDeclaration
      export
      name={`get${capitalizedName}`}
      parameters={[
        { name: "program", type: typespecCompiler.Program },
        { name: decorator.target.name, type: targetType },
      ]}
      returnType={returnType}
    >
      {code`return ${typespecCompiler.getAutoDecoratorValue}(program, "${fqn}", ${decorator.target.name}) as any;`}
    </ts.FunctionDeclaration>
  );
}
