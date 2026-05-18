import { code, namekey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { TypeExpression } from "@typespec/emitter-framework/python";
import type * as cl from "@typespec/http-client";
import { detectLro, type LroMetadata } from "../../lro/index.js";
import { coreHttpModule } from "../external-packages/corehttp.js";
import type { OperationHandler } from "./types.js";

/**
 * Renders a Python long-running operation as a `begin_*` method returning
 * `LROPoller[T]` (sync) — and, in a future async phase, `AsyncLROPoller[T]`.
 *
 * The shape mirrors `pygen.codegen.models.lro_operation.LROOperationBase`:
 *
 * - Public method is renamed with a `begin_` prefix (or `_begin_` for
 *   internal-only operations) if it does not already start with `begin`.
 * - A private companion `_X_initial` method does the first HTTP call and
 *   returns the initial response. The public method calls it and wraps the
 *   result in a poller.
 * - The public method's return type is `LROPoller[FinalResultType]`.
 *
 * LRO detection is heuristic-based until an unbranded LRO contract lands in
 * `@typespec/http-client`. See {@link detectLro}.
 *
 * What's deliberately deferred to a follow-up phase:
 *
 * - Polling strategy selection beyond the default `LROBasePolling`.
 * - `finalStateVia` semantics (azure-async-operation vs. location vs.
 *   original-uri).
 * - The actual HTTP send + initial-response parsing in `_X_initial`.
 * - Async variant (`AsyncLROPoller`).
 * - `cls` callback parameter.
 * - Docstring with `:return:` / `:rtype:` per pygen conventions.
 */
export const LroOperationHandler: OperationHandler = {
  name: "lro",
  canHandle(clientOperation: cl.ClientOperation) {
    return detectLro(clientOperation.httpOperation).isLongRunning;
  },
  render(clientOperation: cl.ClientOperation) {
    const lro = detectLro(clientOperation.httpOperation);
    const operation = clientOperation.httpOperation.operation;
    return (
      <>
        <LroInitialMethod operation={operation} />
        {"\n"}
        <LroBeginMethod operation={operation} lro={lro} />
      </>
    );
  },
};

interface LroBeginMethodProps {
  operation: import("@typespec/compiler").Operation;
  lro: LroMetadata;
}

/**
 * Public `begin_X` method returning `LROPoller[FinalResultType]`.
 */
function LroBeginMethod(props: LroBeginMethodProps) {
  const namePolicy = py.usePythonNamePolicy();
  const baseName = namePolicy.getName(props.operation.name, "function");
  const methodName = beginName(baseName);
  const finalResultExpr = props.lro.finalResultType ? (
    <TypeExpression type={props.lro.finalResultType} />
  ) : (
    "None"
  );
  const returnType = code`${coreHttpModule.polling.LROPoller}[${finalResultExpr}]`;
  const parameters = Array.from(props.operation.parameters.properties.values()).map((p) => ({
    name: namePolicy.getName(p.name, "parameter"),
    type: (<TypeExpression type={p.type} />) as any,
    optional: p.optional,
  }));
  const initialMethodName = initialName(baseName);
  const body = code`
raw_result = self.${initialMethodName}(${parameters.map((p) => p.name).join(", ")})
return ${coreHttpModule.polling.LROPoller}(
    client=self,
    initial_response=raw_result,
    deserialization_callback=lambda pipeline_response: pipeline_response,
    polling_method=${coreHttpModule.polling.LROBasePolling}(),
)
`;
  return (
    <py.MethodDeclaration name={methodName} parameters={parameters} returnType={returnType}>
      {body}
    </py.MethodDeclaration>
  );
}

interface LroInitialMethodProps {
  operation: import("@typespec/compiler").Operation;
}

/**
 * Private `_X_initial` companion method. Stubbed for now — the actual HTTP
 * send/receive will be filled in when basic operation bodies are wired up.
 *
 * The name is passed via a namekey with `ignoreNamePolicy: true` so the
 * leading underscore (Python's "non-public" convention) is preserved through
 * alloy's snake_case name policy, which strips leading underscores.
 */
function LroInitialMethod(props: LroInitialMethodProps) {
  const namePolicy = py.usePythonNamePolicy();
  const baseName = namePolicy.getName(props.operation.name, "function");
  const methodName = namekey(initialName(baseName), { ignoreNamePolicy: true });
  const parameters = Array.from(props.operation.parameters.properties.values()).map((p) => ({
    name: namePolicy.getName(p.name, "parameter"),
    type: (<TypeExpression type={p.type} />) as any,
    optional: p.optional,
  }));
  return (
    <py.MethodDeclaration name={methodName} parameters={parameters} returnType="object">
      {`raise NotImplementedError("Initial call for LRO '${props.operation.name}' is not implemented yet")`}
    </py.MethodDeclaration>
  );
}

/**
 * Prefixes a method name with `begin_` if it does not already start with
 * `begin`. Mirrors pygen's renaming rule.
 */
function beginName(name: string): string {
  return name.replace(/^_+/, "").startsWith("begin") ? name : `begin_${name}`;
}

/**
 * Returns the name of the private `_X_initial` companion method.
 */
function initialName(name: string): string {
  const stripped = name.replace(/^begin_?/, "");
  return `_${stripped}_initial`;
}
