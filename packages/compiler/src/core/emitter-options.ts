import { getLocationInYamlScript } from "../yaml/diagnostics.js";
import { YamlScript } from "../yaml/types.js";
import { createDiagnosticCollector, err } from "./diagnostics.js";
import { validateEmitterOptions } from "./emitter-options/validator.js";
import { createDiagnostic } from "./messages.js";
import { Program, TypeGraph } from "./program.js";
import { createSourceFile } from "./source-file.js";
import { Diagnostic, Model, NoTarget } from "./types.js";

export function resolveEmitterOptions(
  typeGraph: TypeGraph,
): [Model | undefined, readonly Diagnostic[]] {
  const [root] = typeGraph.resolveTypeReference("EmitterOptions");
  const diagnostics = createDiagnosticCollector();

  if (root === undefined) {
    return [
      undefined,
      [
        createDiagnostic({
          code: "missing-emitter-options",
          target: { file: createSourceFile("", typeGraph.entrypoint), pos: 0, end: 0 },
        }),
      ],
    ];
  }
  if (root.kind !== "Model") {
    return err(
      createDiagnostic({
        code: "emitter-options-not-model",
        target: root,
      }),
    );
  }
  return diagnostics.wrap(root);
}

/**
 * Where to anchor diagnostics produced while validating emitter options.
 * `script` is the parsed `tspconfig.yaml` and `basePath` the path to the
 * emitter's options inside it (e.g. `["options", "@typespec/openapi3"]`).
 */
export interface EmitterOptionsConfigTarget {
  readonly script: YamlScript;
  readonly basePath: string[];
}

/**
 * Validate user provided emitter options against the `EmitterOptions` model
 * declared by an emitter and turn validation errors into diagnostics anchored in
 * the `tspconfig.yaml` when available.
 */
export function validateEmitterOptionsAgainstModel(
  program: Program,
  options: Record<string, unknown>,
  model: Model,
  target: EmitterOptionsConfigTarget | typeof NoTarget,
): readonly Diagnostic[] {
  const errors = validateEmitterOptions(program, options, model);
  return errors.map((error): Diagnostic => {
    const diagnosticTarget =
      target === NoTarget
        ? NoTarget
        : getLocationInYamlScript(target.script, [...target.basePath, ...error.target], "key");

    // Re-emit the dedicated `config-path-absolute` diagnostic so options typed with the
    // `absolutePath` scalar keep parity with the legacy JSON-schema `format: absolute-path`.
    if (error.code === "config-path-absolute") {
      return createDiagnostic({
        code: "config-path-absolute",
        format: { path: error.value ?? "" },
        target: diagnosticTarget,
      });
    }

    return createDiagnostic({
      code: "invalid-emitter-options",
      format: { message: error.message },
      target: diagnosticTarget,
    });
  });
}
