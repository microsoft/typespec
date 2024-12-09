import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Model, ModelProperty, navigateType, Type } from "@typespec/compiler";
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

interface MinValueConstrain {
  kind: "MinValue";
  value: number;
}

interface MaxValueConstrain {
  kind: "MaxValue";
  value: number;
}

interface OptionalConstrain {
  kind: "Optional";
  value: boolean;
}

type Constrain = MinValueConstrain | MaxValueConstrain | OptionalConstrain;

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
      const propConstrains = getModelPropertyConstrains(prop);
      return (
        <>
          {propName}: <ZodType type={prop.type} constrains={propConstrains} />
        </>
      );
    },
    { joiner: ",\n" },
  );
}

function getModelPropertyConstrains(modelProperty: ModelProperty): Constrain[] {
  const constrains: Constrain[] = [];
  if (modelProperty.optional) {
    constrains.push({ kind: "Optional", value: true });
  }

  if (modelProperty.type.kind === "Scalar") {
    const minValue = $.type.minValue(modelProperty);
    const maxValue = $.type.maxValue(modelProperty);
    if (minValue !== undefined) {
      constrains.push({ kind: "MinValue", value: minValue });
    }
    if (maxValue !== undefined) {
      constrains.push({ kind: "MaxValue", value: maxValue });
    }
  }
  return constrains;
}

interface ZodTypeProps {
  type: Type;
  constrains: Constrain[];
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
function ZodType(props: ZodTypeProps) {
  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      // TODO: Handle Scalar intrinsic types. See packages/emitter-framework/src/typescript/components/type-expression.tsx
      return getScalarIntrinsicZodType(props);
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

function getScalarIntrinsicZodType(props: ZodTypeProps): string {
// Note: the Prettier extension for VS Code is not formatting the fragments correctly.
// If you turn it on and save your file, it will insert newlines within the fragments, which results in
// incorrect Zod code being emitted.  You can turn off the Prettier extension for this file by adding  "files.exclude": { "**/efv2-zod-sketch/src/emitter.tsx": true } to your .vscode/settings.json file. 
// You can also turn off the Prettier extension for all files by adding "editor.formatOnSave": false to your  .vscode/settings.json file.

  if ($.scalar.is(props.type)) {
    // Types with parity in Zod
    if ($.scalar.isBoolean(props.type)) {
      return <>{zod.z}.boolean()</>;
    }

    if ($.scalar.isBytes(props.type)) {
      return <>{zod.z}.string()</>;
    }

    // Numbers
    if ($.scalar.isDecimal(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }

    // isDecimal128 is problematic.  If intended to be a whole number (integer), it must be less than 2^53-1 and thus
    // can't be represented as a number in JavaScript without using BigInt.  But BigInt
    // makes no sense if this is a floating point number.  We will leave this as a number.
    // Since Decimal128 is a 128-bit floating point number, we'll take the hit in
    // precision if an integer.
    if ($.scalar.isDecimal128(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }

    // Bit limitations don't translate very well, since they really
    // affect precision and not min/max values (i.e. a mismatch won't
    // cause an overflow but just a truncation in accuracy).  We will leave these as
    // numbers.
    if ($.scalar.isFloat(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }
    if ($.scalar.isFloat32(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }
    if ($.scalar.isFloat64(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }

    // With integers, we completely understand the range and can parse to it.
    if ($.scalar.isInteger(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }
    if ($.scalar.isInt8(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -128, 127)}
        </>
      );
    }
    if ($.scalar.isInt16(props.type)) {
      return (
        <>
          {zod.z}.number().min(-32768).max(32767){ZodNumericConstraints(props, -32768, 32767)}
        </>
      );
    }
    if ($.scalar.isInt32(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -2147483648, 2147483647)}
        </>
      );
    }
    if ($.scalar.isInt64(props.type)) {
      return (
        <>
          {zod.z}.bigint(){ZodBigIntConstraints(props, -9223372036854775808n, 9223372036854775807n)}
        </>
      );
    }
    if ($.scalar.isSafeint(props.type)) {
      return (
        <>
          {zod.z}.number().safe(){ZodNumericConstraints(props, undefined, undefined)}
        </>
      );
    }
    if ($.scalar.isUint8(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 255)}
        </>
      );
    }
    if ($.scalar.isUint16(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 65535)}
        </>
      );
    }
    if ($.scalar.isUint32(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 4294967295)}
        </>
      );
    }
    if ($.scalar.isUint64(props.type)) {
      return (
        <>
          {zod.z}.bigint().nonnegative(){ZodBigIntConstraints(props, undefined, 18446744073709551615n)}
        </>
      );
    }

    if ($.scalar.isString(props.type)) {
      return <>{zod.z}.string()</>;
    }
    if ($.scalar.isUrl(props.type)) {
      return <>{zod.z}.string().url()</>;
    }

    if ($.scalar.isNumeric(props.type)) {
      if ($.scalar.extendsNumeric(props.type)) {
        return (
          <>
            {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          </>
        );
      }
    }

    //Dates and times
    if ($.scalar.isUtcDateTime(props.type)) {
      return <>{zod.z}.string().datetime()</>;
    }
    if ($.scalar.isOffsetDateTime(props.type)) {
      return <>{zod.z}.string().datetime( &#123;offset: true&#125;)</>;
    }
    if ($.scalar.isDuration(props.type)) {
      return <>{zod.z}.string().duration()</>;
    }
    if ($.scalar.isPlainDate(props.type)) {
      return <>{zod.z}.string().date()</>;
    }
    if ($.scalar.isPlainTime(props.type)) {
      return <>{zod.z}.string().time()</>;
    }
  }
  return <>{zod.z}.string()</>;
}

function ZodNumericConstraints(
  props: ZodTypeProps,
  minOverride: number | undefined,
  maxOverride: number | undefined,
): string {
  const minValue = props.constrains.find((c) => c.kind === "MinValue")?.value;
  const maxValue = props.constrains.find((c) => c.kind === "MaxValue")?.value;
  const min: string =
    minOverride !== undefined
      ? `.min(${minOverride})`
      : minValue !== undefined
        ? `.min(${minValue})`
        : "";
  const max: string =
    maxOverride !== undefined
      ? `.max(${maxOverride})`
      : maxValue !== undefined
        ? `.max(${maxValue})`
        : "";
  const minmax = min + max;
  return minmax;
}

function ZodBigIntConstraints(
  props: ZodTypeProps,
  minOverride: bigint | undefined,
  maxOverride: bigint | undefined,
): string {
  const minValue = props.constrains.find((c) => c.kind === "MinValue")?.value;
  const maxValue = props.constrains.find((c) => c.kind === "MaxValue")?.value;
  const min: string =
    minOverride !== undefined
      ? `.gte(${minOverride}n)`
      : minValue !== undefined
        ? `.gte(${minValue}n)`
        : "";
  const max: string =
    maxOverride !== undefined
      ? `.lte(${maxOverride}n)`
      : maxValue !== undefined
        ? `.lte(${maxValue}n)`
        : "";
  const minmax = min + max;
  return minmax;
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
