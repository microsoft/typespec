import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Model, navigateType, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { zod } from "./external-packages/zod.js";

export async function $onEmit(context: EmitContext) {
  // Get all models
  const models = getModels();
  const tsNamePolicy = ts.createTSNamePolicy();

  // Emit all models
  return (
    <ay.Output namePolicy={tsNamePolicy} externals={[zod]}>
      <ts.PackageDirectory name="test-package" version="0.0.1" path=".">
        <ay.SourceDirectory path="src">
          <ts.SourceFile path="models.ts">
            {ay.mapJoin(
              models,
              (model) => {
                return <ZodModel model={model} />;
              },
              { joiner: "\n\n" },
            )}
          </ts.SourceFile>
        </ay.SourceDirectory>
      </ts.PackageDirectory>
    </ay.Output>
  );
}

interface ModelProps {
  model: Model;
}

/**
 * Component that represents a Zod Model
 */
function ZodModel(props: ModelProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.model.name, "variable");
  return (
    <ts.VarDeclaration export name={modelName}>
      {zod.z}.object(
      {ay.code`{
         ${(<ZodModelProperties model={props.model} />)}
      }`}
      )
    </ts.VarDeclaration>
  );
}

interface ZodModelPropertiesProps {
  model: Model;
}

/**
 * Component that represents a collection of Zod Model properties
 */
function ZodModelProperties(props: ZodModelPropertiesProps) {
  const namePolicy = ts.useTSNamePolicy();

  return ay.mapJoin(
    props.model.properties,
    (name, prop) => {
      const propName = namePolicy.getName(name, "object-member-data");
      return (
        <>
          {propName}: <ZodType type={prop.type} />
        </>
      );
    },
    { joiner: ",\n" },
  );
}

interface ZodTypeProps {
  type: Type;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
function ZodType(props: ZodTypeProps) {
  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      // TODO: Handle Scalar intrinsic types. See packages/emitter-framework/src/typescript/components/type-expression.tsx
      return <>{zod.z}.string()</>;
    case "Boolean":
      return <>{zod.z}.boolean()</>;
    case "String":
      return <>{zod.z}.string()</>;
    case "Number":
      return <>{zod.z}.number()</>;
    default:
      return <>{zod.z}.any()</>;
  }
}

/**
 * Collects all the models defined in the spec
 * @returns A collection of all defined models in the spec
 */
function getModels() {
  const models = new Set<Model>();

  const globalNs = $.program.getGlobalNamespaceType();

  // There might be models defined in the global namespace. For example https://bit.ly/4fTYkD6
  const globalModels = Array.from(globalNs.models.values());

  // Get all namespaces defined in the spec, excluding TypeSpec namespace.
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec"),
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        model(model) {
          // Ignore models from TypeSpec namespace, i.e Array or Record
          // We only want models defined in the spec
          if (model.namespace && model.namespace.name === "TypeSpec") {
            return;
          }
          models.add(model);
        },
      },
      { includeTemplateDeclaration: false },
    );
  }

  return [...globalModels, ...models];
}
