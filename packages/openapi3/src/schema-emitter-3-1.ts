import {
  ArrayBuilder,
  AssetEmitter,
  createAssetEmitter,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  setProperty,
  TypeEmitter,
} from "@typespec/asset-emitter";
import {
  compilerAssert,
  Enum,
  getDiscriminatedUnion,
  getDoc,
  getExamples,
  getMaxValueExclusive,
  getMinValueExclusive,
  getSummary,
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  Program,
  Scalar,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import { MetadataInfo } from "@typespec/http";
import { getOneOf } from "./decorators.js";
import { serializeExample } from "./examples.js";
import { JsonSchemaModule } from "./json-schema.js";
import { OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { applyEncoding, getRawBinarySchema } from "./openapi-helpers-3-1.js";
import { CreateSchemaEmitter } from "./openapi-spec-mappings.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { OpenAPI3SchemaEmitterBase } from "./schema-emitter.js";
import { JsonType, OpenAPISchema3_1 } from "./types.js";
import { isBytesKeptRaw, isLiteralType, literalType } from "./util.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

function createWrappedSchemaEmitterClass(
  metadataInfo: MetadataInfo,
  visibilityUsage: VisibilityUsageTracker,
  options: ResolvedOpenAPI3EmitterOptions,
  optionalDependencies: { jsonSchemaModule?: JsonSchemaModule; xmlModule?: XmlModule },
): typeof TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions> {
  return class extends OpenAPI31SchemaEmitter {
    constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
      super(emitter, metadataInfo, visibilityUsage, options, optionalDependencies);
    }
  };
}

export const createSchemaEmitter3_1: CreateSchemaEmitter = ({ program, context, ...rest }) => {
  return createAssetEmitter(
    program,
    createWrappedSchemaEmitterClass(
      rest.metadataInfo,
      rest.visibilityUsage,
      rest.options,
      rest.optionalDependencies,
    ),
    context,
  );
};

/**
 * OpenAPI 3.1 schema emitter. Deals with emitting content of `components/schemas` section.
 */
export class OpenAPI31SchemaEmitter extends OpenAPI3SchemaEmitterBase<OpenAPISchema3_1> {
  #applySchemaExamples(
    program: Program,
    type: Model | Scalar | Union | Enum | ModelProperty,
    target: ObjectBuilder<any>,
  ) {
    const examples = getExamples(program, type);
    if (examples.length > 0) {
      setProperty(
        target,
        "examples",
        examples.map((example) => serializeExample(program, example.value, type)),
      );
    }
  }

  applyCustomConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    target: ObjectBuilder<OpenAPISchema3_1>,
    refSchema?: OpenAPISchema3_1,
  ) {
    const applyConstraint = (fn: (p: Program, t: Type) => any, key: keyof OpenAPISchema3_1) => {
      const value = fn(program, type);
      if (value !== undefined) {
        target[key] = value;
      }
    };

    const applyTypeConstraint = (fn: (p: Program, t: Type) => Type | undefined, key: string) => {
      const constraintType = fn(this.emitter.getProgram(), type);
      if (constraintType) {
        const ref = this.emitter.emitTypeReference(constraintType);
        compilerAssert(ref.kind === "code", "Unexpected non-code result from emit reference");
        setProperty(target, key, ref.value);
      }
    };

    const program = this.emitter.getProgram();

    const minValueExclusive = getMinValueExclusive(program, type);
    if (minValueExclusive !== undefined) {
      target.minimum = undefined;
      target.exclusiveMinimum = minValueExclusive;
    }

    const maxValueExclusive = getMaxValueExclusive(program, type);
    if (maxValueExclusive !== undefined) {
      target.maximum = undefined;
      target.exclusiveMaximum = maxValueExclusive;
    }

    // apply json schema decorators
    const jsonSchemaModule = this._jsonSchemaModule;
    if (jsonSchemaModule) {
      applyTypeConstraint(jsonSchemaModule.getContains, "contains");
      applyConstraint(jsonSchemaModule.getMinContains, "minContains");
      applyConstraint(jsonSchemaModule.getMaxContains, "maxContains");
      applyConstraint(jsonSchemaModule.getContentEncoding, "contentEncoding");
      applyConstraint(jsonSchemaModule.getContentMediaType, "contentMediaType");
      applyTypeConstraint(jsonSchemaModule.getContentSchema, "contentSchema");

      const prefixItems = jsonSchemaModule.getPrefixItems(program, type);
      if (prefixItems) {
        const prefixItemsSchema = new ArrayBuilder<Record<string, unknown>>();
        for (const item of prefixItems.values) {
          prefixItemsSchema.push(this.emitter.emitTypeReference(item));
        }
        setProperty(target, "prefixItems", prefixItemsSchema as any);
      }
    }

    this.#applySchemaExamples(program, type, target);
  }

  applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: OpenAPISchema3_1 | Placeholder<OpenAPISchema3_1>,
  ): OpenAPISchema3_1 {
    return applyEncoding(this.emitter.getProgram(), typespecType, target as any, this._options);
  }

  applyModelIndexer(schema: ObjectBuilder<any>, model: Model): void {
    const shouldSeal = this.shouldSealSchema(model);
    if (!shouldSeal && !model.indexer) return;

    const unevaluatedPropertiesSchema = shouldSeal
      ? { not: {} }
      : this.emitter.emitTypeReference(model.indexer!.value);
    setProperty(schema, "unevaluatedProperties", unevaluatedPropertiesSchema);
  }

  getRawBinarySchema(): OpenAPISchema3_1 {
    return getRawBinarySchema();
  }

  getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPISchema3_1 {
    // Raw binary data is handled separately when resolving a request/response body.
    // Open API 3.1 treats encoded binaries differently from Open API 3.0, so we need to handle
    // the Scalar 'bytes' special here.
    // @see https://spec.openapis.org/oas/v3.1.1.html#working-with-binary-data
    if (scalar.name === "bytes") {
      const contentType = this.emitter.getContext().contentType;
      return { type: "string", contentMediaType: contentType, contentEncoding: "base64" };
    }
    return super.getSchemaForStdScalars(scalar);
  }

  enumSchema(en: Enum): OpenAPISchema3_1 {
    const program = this.emitter.getProgram();
    if (en.members.size === 0) {
      reportDiagnostic(program, { code: "empty-enum", target: en });
      return {};
    }

    if (this._options.enumStrategy === "annotated") {
      return this.#annotatedEnumSchema(en);
    }

    const enumTypes = new Set<JsonType>();
    const enumValues = new Set<string | number>();
    for (const member of en.members.values()) {
      enumTypes.add(typeof member.value === "number" ? "number" : "string");
      enumValues.add(member.value ?? member.name);
    }

    const enumTypesArray = [...enumTypes];

    const schema: OpenAPISchema3_1 = {
      type: enumTypesArray.length === 1 ? enumTypesArray[0] : enumTypesArray,
      enum: [...enumValues],
    };

    return this.applyConstraints(en, schema);
  }

  #annotatedEnumSchema(en: Enum): OpenAPISchema3_1 {
    const program = this.emitter.getProgram();
    const oneOf: OpenAPISchema3_1[] = [];
    for (const member of en.members.values()) {
      const value = member.value ?? member.name;
      const subschema: OpenAPISchema3_1 = { const: value };
      const title = getSummary(program, member);
      if (title !== undefined) {
        subschema.title = title;
      }
      const description = getDoc(program, member);
      if (description !== undefined) {
        subschema.description = description;
      }
      oneOf.push(subschema);
    }

    return this.applyConstraints(en, { oneOf });
  }

  protected override combineRefWithConstraints(
    refSchema: any,
    constraints: Partial<OpenAPISchema3_1>,
  ): any {
    // Some constraints already compose the reference themselves (e.g. the XML module wraps
    // it in an `allOf`). In that case defer to the base behavior, otherwise we would emit
    // both a top-level `$ref` and an `allOf` pointing at the same schema.
    if ("allOf" in constraints) {
      return super.combineRefWithConstraints(refSchema, constraints);
    }
    // OpenAPI 3.1 allows keywords alongside `$ref` (JSON Schema 2020-12 semantics),
    // so the constraints are merged directly onto the reference instead of wrapping it
    // in an unnecessary `allOf`.
    const merged = new ObjectBuilder<OpenAPISchema3_1>(refSchema);
    for (const [key, value] of Object.entries(constraints)) {
      setProperty(merged, key, value);
    }
    return merged;
  }

  // Builds an annotated `const` subschema for a single literal union variant,
  // mirroring `#annotatedEnumSchema`'s per-member handling: the variant value
  // becomes `const`, `@summary` becomes `title`, and the doc comment/`@doc`
  // becomes `description`. Title/description are omitted when absent. Like the
  // enum case, the variant name is NOT used as a title fallback.
  #annotatedVariantSchema(variant: UnionVariant): OpenAPISchema3_1 {
    const program = this.emitter.getProgram();
    compilerAssert(isLiteralType(variant.type), "Expected a literal union variant");
    const subschema: OpenAPISchema3_1 = { const: variant.type.value };
    const title = getSummary(program, variant);
    if (title !== undefined) {
      subschema.title = title;
    }
    const description = getDoc(program, variant);
    if (description !== undefined) {
      subschema.description = description;
    }
    return subschema;
  }

  unionSchema(union: Union): ObjectBuilder<OpenAPISchema3_1> {
    const program = this.emitter.getProgram();
    const [discriminated] = getDiscriminatedUnion(program, union);
    if (discriminated) {
      return this.discriminatedUnion(discriminated);
    }
    if (union.variants.size === 0) {
      reportDiagnostic(program, { code: "empty-union", target: union });
      return new ObjectBuilder({});
    }
    const variants = Array.from(union.variants.values());
    const literalVariantEnumByType: Record<string, any[]> = {};
    const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
    const schemaMembers: { schema: any; type: Type | null }[] = [];
    const isMultipart = this.getContentType().startsWith("multipart/");

    // 1. Iterate over all the union variants to generate a schema for each one.
    for (const variant of variants) {
      // 2. Special handling for multipart - want to treat as binary
      if (isMultipart && isBytesKeptRaw(program, variant.type)) {
        schemaMembers.push({ schema: this.getRawBinarySchema(), type: variant.type });
        continue;
      }

      // 3.a. Literal types are actual values (though not Value types)
      if (isLiteralType(variant.type)) {
        // With the annotated enum strategy, emit each literal variant as its own
        // `const` subschema carrying per-variant `title`/`description` (from
        // `@summary`/`@doc`), following the OpenAPI 3.1.1 annotated enumerations
        // pattern. This preserves the variant-level documentation that the
        // default `enum`-merge form below discards. See `#annotatedVariantSchema`.
        if (this._options.enumStrategy === "annotated") {
          schemaMembers.push({ schema: this.#annotatedVariantSchema(variant), type: null });
          continue;
        }
        // Create schemas grouped by kind (boolean, string, numeric)
        // and add the literals seen to each respective `enum` array
        if (!literalVariantEnumByType[variant.type.kind]) {
          const enumValue: any[] = [variant.type.value];
          literalVariantEnumByType[variant.type.kind] = enumValue;
          schemaMembers.push({
            schema: { type: literalType(variant.type), enum: enumValue },
            type: null,
          });
        } else {
          literalVariantEnumByType[variant.type.kind].push(variant.type.value);
        }
      } else {
        // 3.b. Anything else, we get the schema for that type.
        const enumSchema = this.emitter.emitTypeReference(variant.type, {
          referenceContext: isMultipart ? { contentType: "application/json" } : {},
        });
        compilerAssert(enumSchema.kind === "code", "Unexpected enum schema. Should be kind: code");
        schemaMembers.push({ schema: enumSchema.value, type: variant.type });
      }
    }

    const wrapWithObjectBuilder = (
      schemaMember: { schema: any; type: Type | null },
      { mergeUnionWideConstraints }: { mergeUnionWideConstraints: boolean },
    ): ObjectBuilder<OpenAPISchema3_1> => {
      const schema = schemaMember.schema;
      const additionalProps: Partial<OpenAPISchema3_1> = mergeUnionWideConstraints
        ? this.applyConstraints(union, {})
        : {};

      if (Object.keys(additionalProps).length === 0) {
        return new ObjectBuilder(schema);
      } else {
        // OpenAPI 3.1 allows sibling keywords next to `$ref`, so union-wide
        // constraints are merged directly onto the member schema.
        return this.combineRefWithConstraints(schema, additionalProps);
      }
    };

    if (schemaMembers.length === 0) {
      compilerAssert(false, "Attempting to emit an empty union");
    }

    if (schemaMembers.length === 1) {
      return wrapWithObjectBuilder(schemaMembers[0], { mergeUnionWideConstraints: true });
    }

    const schema: OpenAPISchema3_1 = {
      [ofType]: schemaMembers.map((m) =>
        wrapWithObjectBuilder(m, { mergeUnionWideConstraints: false }),
      ),
    };

    return this.applyConstraints(union, schema);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (name) {
      case "unknown":
        return {};
      case "null":
        return { type: "null" };
    }

    reportDiagnostic(this.emitter.getProgram(), {
      code: "invalid-schema",
      format: { type: name },
      target: intrinsic,
    });
    return {};
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<Record<string, any>> {
    return new ObjectBuilder({
      type: "array",
      prefixItems: this.emitter.emitTupleLiteralValues(tuple),
    });
  }

  tupleLiteralValues(tuple: Tuple): EmitterOutput<Record<string, any>> {
    const values = new ArrayBuilder();
    for (const value of tuple.values.values()) {
      values.push(this.emitter.emitType(value));
    }
    return values;
  }
}
