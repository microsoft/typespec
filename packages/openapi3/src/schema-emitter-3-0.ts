import {
  AssetEmitter,
  createAssetEmitter,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  TypeEmitter,
} from "@typespec/asset-emitter";
import {
  compilerAssert,
  Enum,
  getDiscriminatedUnion,
  getExamples,
  getMaxValueExclusive,
  getMinValueExclusive,
  IntrinsicType,
  isNullType,
  Model,
  ModelProperty,
  Scalar,
  serializeValueAsJson,
  Type,
  Union,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { MetadataInfo } from "@typespec/http";
import { shouldInline } from "@typespec/openapi";
import { getOneOf } from "./decorators.js";
import { JsonSchemaModule } from "./json-schema.js";
import { OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { applyEncoding, getRawBinarySchema } from "./openapi-helpers-3-0.js";
import { CreateSchemaEmitter } from "./openapi-spec-mappings.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { Builders, OpenAPI3SchemaEmitterBase } from "./schema-emitter.js";
import { JsonType, OpenAPI3Schema } from "./types.js";
import { isBytesKeptRaw, isLiteralType, literalType } from "./util.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

function createWrappedSchemaEmitterClass(
  metadataInfo: MetadataInfo,
  visibilityUsage: VisibilityUsageTracker,
  options: ResolvedOpenAPI3EmitterOptions,
  optionalDependencies: { jsonSchemaModule?: JsonSchemaModule; xmlModule?: XmlModule },
): typeof TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions> {
  return class extends OpenAPI3SchemaEmitter {
    constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
      super(emitter, metadataInfo, visibilityUsage, options, optionalDependencies);
    }
  };
}

export const createSchemaEmitter3_0: CreateSchemaEmitter = ({ program, context, ...rest }) => {
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
 * OpenAPI 3.0 schema emitter. Deals with emitting content of `components/schemas` section.
 */
export class OpenAPI3SchemaEmitter extends OpenAPI3SchemaEmitterBase<OpenAPI3Schema> {
  #applySchemaExamples(
    type: Model | Scalar | Union | Enum | ModelProperty,
    target: ObjectBuilder<any>,
  ) {
    const program = this.emitter.getProgram();
    const examples = getExamples(program, type);
    if (examples.length > 0) {
      target.set("example", serializeValueAsJson(program, examples[0].value, type));
    }
  }

  applyCustomConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    target: ObjectBuilder<OpenAPI3Schema>,
    refSchema?: OpenAPI3Schema,
  ) {
    const program = this.emitter.getProgram();

    const minValueExclusive = getMinValueExclusive(program, type);
    if (minValueExclusive !== undefined) {
      target.minimum = minValueExclusive;
      target.exclusiveMinimum = true;
    }

    const maxValueExclusive = getMaxValueExclusive(program, type);
    if (maxValueExclusive !== undefined) {
      target.maximum = maxValueExclusive;
      target.exclusiveMaximum = true;
    }

    this.#applySchemaExamples(type, target);
  }

  applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: OpenAPI3Schema | Placeholder<OpenAPI3Schema>,
  ): OpenAPI3Schema {
    return applyEncoding(this.emitter.getProgram(), typespecType, target as any, this._options);
  }

  getRawBinarySchema(): OpenAPI3Schema {
    return getRawBinarySchema();
  }

  enumSchema(en: Enum): OpenAPI3Schema {
    const program = this.emitter.getProgram();
    if (en.members.size === 0) {
      reportDiagnostic(program, { code: "empty-enum", target: en });
      return {};
    }

    const enumTypes = new Set<JsonType>();
    const enumValues = new Set<string | number>();
    for (const member of en.members.values()) {
      enumTypes.add(typeof member.value === "number" ? "number" : "string");
      enumValues.add(member.value ?? member.name);
    }

    if (enumTypes.size > 1) {
      reportDiagnostic(program, { code: "enum-unique-type", target: en });
    }

    const schema: OpenAPI3Schema = {
      type: enumTypes.values().next().value!,
      enum: [...enumValues],
    };

    return this.applyConstraints(en, schema);
  }

  unionSchema(union: Union): ObjectBuilder<OpenAPI3Schema> {
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
    let nullable = false;
    const isMultipart = this.getContentType().startsWith("multipart/");

    for (const variant of variants) {
      if (isNullType(variant.type)) {
        nullable = true;
        continue;
      }

      if (isMultipart && isBytesKeptRaw(program, variant.type)) {
        schemaMembers.push({ schema: this.getRawBinarySchema(), type: variant.type });
        continue;
      }

      if (isLiteralType(variant.type)) {
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
    ): ObjectBuilder<OpenAPI3Schema> => {
      // we can just return the single schema member after applying nullable
      const schema = schemaMember.schema;
      const type = schemaMember.type;
      const additionalProps: Partial<OpenAPI3Schema> = mergeUnionWideConstraints
        ? this.applyConstraints(union, {})
        : {};

      if (mergeUnionWideConstraints && nullable) {
        additionalProps.nullable = true;
      }

      if (Object.keys(additionalProps).length === 0) {
        return new ObjectBuilder(schema);
      } else {
        if (
          (schema instanceof Placeholder || "$ref" in schema) &&
          !(type && shouldInline(program, type))
        ) {
          if (type && type.kind === "Model") {
            return new ObjectBuilder({
              type: "object",
              allOf: Builders.array([schema]),
              ...additionalProps,
            });
          } else if (type && type.kind === "Scalar") {
            const stdType = $.scalar.getStdBase(type);
            const outputType: JsonType | undefined = stdType
              ? this.getSchemaForStdScalars(stdType as any).type
              : undefined;
            return new ObjectBuilder({
              type: outputType,
              allOf: Builders.array([schema]),
              ...additionalProps,
            });
          } else {
            return new ObjectBuilder({ allOf: Builders.array([schema]), ...additionalProps });
          }
        } else {
          const merged = new ObjectBuilder<OpenAPI3Schema>(schema);
          for (const [key, value] of Object.entries(additionalProps)) {
            merged.set(key, value);
          }
          return merged;
        }
      }
    };

    const checkMerge = (schemaMembers: { schema: any; type: Type | null }[]): boolean => {
      if (nullable) {
        for (const m of schemaMembers) {
          if (m.schema instanceof Placeholder || "$ref" in m.schema) {
            return true;
          }
        }
      }
      return false;
    };

    if (schemaMembers.length === 0) {
      if (nullable) {
        // This union is equivalent to just `null` but OA3 has no way to specify
        // null as a value, so we throw an error.
        reportDiagnostic(program, { code: "union-null", target: union });
        return new ObjectBuilder({});
      } else {
        // completely empty union can maybe only happen with bugs?
        compilerAssert(false, "Attempting to emit an empty union");
      }
    }

    if (schemaMembers.length === 1) {
      return wrapWithObjectBuilder(schemaMembers[0], { mergeUnionWideConstraints: true });
    }

    const isMerge = checkMerge(schemaMembers);
    const schema: OpenAPI3Schema = {
      [ofType]: schemaMembers.map((m) =>
        wrapWithObjectBuilder(m, { mergeUnionWideConstraints: isMerge }),
      ),
    };

    if (!isMerge && nullable) {
      schema.nullable = true;
    }

    return this.applyConstraints(union, schema);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (name) {
      case "unknown":
        return {};
      case "null":
        return { nullable: true };
    }

    reportDiagnostic(this.emitter.getProgram(), {
      code: "invalid-schema",
      format: { type: name },
      target: intrinsic,
    });
    return {};
  }
}
