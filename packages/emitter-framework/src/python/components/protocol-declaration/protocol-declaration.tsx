import { useTsp } from "#core/context/tsp-context.js";
import { typingModule } from "#python/builtins.js";
import { TypeExpression } from "#python/components/type-expression/type-expression.jsx";
import { reportPythonDiagnostic } from "#python/lib.js";
import { declarationRefkeys } from "#python/utils/refkey.js";
import { mapJoin } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Interface, Model, Operation, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";

export function Ellipsis() {
  return <>...</>;
}

export interface ProtocolDeclarationProps extends Omit<py.ClassDeclarationProps, "name"> {
  type: Interface | Operation;
  name?: string;
}

export function ProtocolDeclaration(props: ProtocolDeclarationProps) {
  const { $ } = useTsp();

  const refkeys = declarationRefkeys(props.refkey, props.type);
  const protocolBase = typingModule["."]["Protocol"];

  const namePolicy = py.usePythonNamePolicy();
  const originalName = props.name ?? (props.type as any)?.name ?? "";
  const name = namePolicy.getName(originalName, "class");

  // Interfaces will be converted to Protocols with method stubs for operations
  if ((props.type as any)?.kind === "Interface") {
    const iface = props.type as Interface;
    const operations = ((iface as any).operations ?? new Map()) as Map<string, any>;
    const methods = mapJoin(
      () => Array.from(operations.values()) as any[],
      (op: any) => {
        const methodName = namePolicy.getName(op.name, "function");
        const prm = buildCallableParameters($, op as Operation); // self injected by MethodDeclaration
        const ret = (op as any)?.returnType ? (
          <TypeExpression type={(op as Operation).returnType as Type} />
        ) : undefined;
        return (
          <py.MethodDeclaration name={methodName} parameters={prm} returnType={ret}>
            <Ellipsis />
          </py.MethodDeclaration>
        );
      },
    );
    return (
      <py.ClassDeclaration name={name} bases={[protocolBase]} refkey={refkeys} doc={props.doc}>
        {methods}
      </py.ClassDeclaration>
    );
  }

  if ((props.type as any)?.kind !== "Operation") {
    reportPythonDiagnostic($.program, {
      code: "python-unsupported-type",
      target: props.type as any,
    });
    return <></>;
  }

  // Operations will be converted to Callback protocol using a dunder __call__ method
  const op = props.type as Operation;
  const cbParams = buildCallableParameters($, op);
  const cbReturn = (op as any)?.returnType ? (
    <TypeExpression type={op.returnType as Type} />
  ) : undefined;
  return (
    <py.ClassDeclaration name={name} bases={[protocolBase]} refkey={refkeys} doc={props.doc}>
      <py.DunderMethodDeclaration name="__call__" returnType={cbReturn} parameters={cbParams}>
        <Ellipsis />
      </py.DunderMethodDeclaration>
    </py.ClassDeclaration>
  );
}

function buildCallableParameters($: Typekit, op: Operation) {
  const paramsModel = op.parameters as unknown as Model | undefined;
  const items: any[] = [];
  if (paramsModel) {
    try {
      const props = $.model.getProperties(paramsModel);
      for (const p of props.values()) {
        items.push({
          name: p.name,
          type: <TypeExpression type={p.type} />,
          optional: p.optional,
        });
      }
    } catch {
      // fallthrough, no params
    }
  }
  return items as py.ParameterDescriptor[];
}
