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
          {zod.z}.number()
          <ZodConstraints type={props.type} />
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
          {zod.z}.number()
          <ZodConstraints type={props.type} />
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
          {zod.z}.number()
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isFloat32(props.type)) {
      return (
        <>
          {zod.z}.number()
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isFloat64(props.type)) {
      return (
        <>
          {zod.z}.number()
          <ZodConstraints type={props.type} />
        </>
      );
    }

    // With integers, we completely understand the range and can parse to it.
    if ($.scalar.isInteger(props.type)) {
      return (
        <>
          {zod.z}.number()
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isInt8(props.type)) {
      return (
        <>
          {zod.z}.number().min(-128).max(127)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isInt16(props.type)) {
      return (
        <>
          {zod.z}.number().min(-32768).max(32767)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isInt32(props.type)) {
      return (
        <>
          {zod.z}.number().min(-2,147,483,648).max(2,147,483,647)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isInt64(props.type)) {
      return (
        <>
          {zod.z}.number().bigint().min(-9,223,372,036,854,775,808).max(9,223,372,036,854,775,807)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isSafeint(props.type)) {
      return (
        <>
          {zod.z}.number().safe()
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isUint8(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative().max(255)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isUint16(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative().max(65535)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isUint32(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative().nonnegative.max(4,294,967,295)
          <ZodConstraints type={props.type} />
        </>
      );
    }
    if ($.scalar.isUint64(props.type)) {
      return (
        <>
          {zod.z}.number().bigint().nonnegative().max(18,446,744,073,709,551,615)
          <ZodConstraints type={props.type} />
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
      return <>{zod.z}.number()</>;
    }

    //Dates and times
    if ($.scalar.isUtcDateTime(props.type)) {
      return <>{zod.z}.string().datetime()</>;
    }
    if ($.scalar.isOffsetDateTime(props.type)) {
      return <>{zod.z}.string().datetime( &#123;offset: true&#125;)</>;
    }
    if ($.scalar.isDuration(props.type)) {
      return <>{zod.z}.duration()</>;
    }
    if ($.scalar.isPlainDate(props.type)) {
      return <>{zod.z}.date()</>;
    }
    if ($.scalar.isPlainTime(props.type)) {
      return <>{zod.z}.time()</>;
    }

    // Types without parity in Zod -- consider throwing an error instead
  }
  return <>{zod.z}.string()</>;
}

function ZodConstraints(props: ZodTypeProps) {
  if ($.scalar.extendsNumeric(props.type)) {
    const min = $.scalar.getMin(props.type);
    const max = $.scalar.getMax(props.type);

    return (
      <>
        {min !== undefined ? <>.min({min})</> : null}
        {max !== undefined ? <>.max({max})</> : null}
      </>
    );
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
