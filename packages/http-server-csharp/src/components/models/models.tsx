import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { isErrorModel, type Model, type Namespace as TspNamespace } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { ClassDeclaration as EfClassDeclaration } from "@typespec/emitter-framework/csharp";
import { isStatusCode } from "@typespec/http";
import { getSubNamespaceParts } from "../../utils/namespace-utils.js";
import { CSharpFile } from "../csharp-file.jsx";
import { efRefkey } from "../type-expression/type-expression.jsx";
import { getErrorConstructor } from "./error-models.jsx";
import { getModelEmitName, modelNeedsJsonNodes } from "./model-helpers.js";

// Re-export public API used by other modules
export { getAnonymousModelName } from "./anonymous-models.js";

const modelUsings = [
  "System",
  "System.Collections.Generic",
  "System.Text.Json",
  "TypeSpec.Helpers.JsonConverters",
  "TypeSpec.Helpers",
];

export interface ModelsProps {
  /** Pre-resolved models to emit. */
  models: Model[];
  /** The service namespace for sub-namespace wrapping. */
  serviceNamespace: TspNamespace | undefined;
}

/**
 * Iterates pre-resolved models and emits C# class declarations.
 * Each model is emitted in its own source file under the models directory.
 */
export function Models(props: ModelsProps): Children {
  const { $ } = useTsp();

  return (
    <For each={props.models}>
      {(model) => {
        const needsJsonNodes = modelNeedsJsonNodes($, model);
        const usings = needsJsonNodes ? [...modelUsings, "System.Text.Json.Nodes"] : modelUsings;
        const modelName = getModelEmitName($.program, model);
        const subNsParts = getSubNamespaceParts(model.namespace, props.serviceNamespace);

        const modelContent = <ServerClassDeclaration type={model} emitName={modelName} />;

        // Wrap in sub-namespace if the model is in a sub-namespace of the service
        const wrappedContent = subNsParts.reduceRight<Children>(
          (content, nsPart) => <cs.Namespace name={nsPart}>{content}</cs.Namespace>,
          modelContent,
        );

        return (
          <CSharpFile path={`${modelName}.cs`} using={usings}>
            {wrappedContent}
          </CSharpFile>
        );
      }}
    </For>
  );
}

interface ServerClassDeclarationProps {
  type: Model;
  emitName?: string;
}

/**
 * Server-specific class declaration that matches the old emitter output:
 * - No `required` keyword
 * - No `[JsonPropertyName]` attributes
 * - No nullable `?` suffix on reference types (string, byte[], etc.)
 */
function ServerClassDeclaration(props: ServerClassDeclarationProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();
  const className = namePolicy.getName(props.emitName ?? props.type.name, "class");

  const isError = isErrorModel($.program, props.type);

  // `@statusCode` is carried by the generated exception, not by a property.
  const properties = Array.from(props.type.properties.values()).filter(
    (p) => !(isError && isStatusCode($.program, p)),
  );

  const errorConstructor = isError ? getErrorConstructor($, props.type, className) : undefined;

  // An error model that is itself subclassed needs a constructor its children can chain to.
  const hasChildConstructor =
    isError && props.type.derivedModels && props.type.derivedModels.length > 0;

  return (
    <EfClassDeclaration
      type={props.type}
      name={className}
      refkey={efRefkey(props.type)}
      public
      partial
      baseType={!props.type.baseModel && isError ? "HttpServiceException" : undefined}
      properties={properties}
    >
      {errorConstructor}
      {errorConstructor && <hbr />}
      {hasChildConstructor && (
        <cs.Constructor
          public
          parameters={[
            { name: "statusCode", type: "int" },
            { name: "value", type: "object?", default: "null" },
            { name: "headers", type: "Dictionary<string, string>?", default: "default" },
          ]}
          baseConstructor={["statusCode", "value", "headers"]}
        />
      )}
      {hasChildConstructor && <hbr />}
    </EfClassDeclaration>
  );
}
