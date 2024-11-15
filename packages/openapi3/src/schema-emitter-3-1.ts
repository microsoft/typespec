import {
  compilerAssert,
  Enum,
  getDiscriminatedUnion,
  getDiscriminator,
  getExamples,
  getMaxValueExclusive,
  getMinValueExclusive,
  ignoreDiagnostics,
  IntrinsicType,
  isNullType,
  Model,
  ModelProperty,
  Program,
  Scalar,
  serializeValueAsJson,
  Type,
  Union,
} from "@typespec/compiler";
import {
  AssetEmitter,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  TypeEmitter,
} from "@typespec/compiler/emitter-framework";
import { MetadataInfo } from "@typespec/http";
import { shouldInline } from "@typespec/openapi";
import { getOneOf } from "./decorators.js";
import { OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { Builders, OpenAPI3SchemaEmitterBase } from "./schema-emitter.js";
import { JsonType, OpenAPISchema3_1 } from "./types.js";
import { isBytesKeptRaw, isLiteralType, literalType } from "./util.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

export function createWrappedOpenAPI31SchemaEmitterClass(
  metadataInfo: MetadataInfo,
  visibilityUsage: VisibilityUsageTracker,
  options: ResolvedOpenAPI3EmitterOptions,
  xmlModule: XmlModule | undefined,
): typeof TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions> {
  return class extends OpenAPI31SchemaEmitter {
    constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
      super(emitter, metadataInfo, visibilityUsage, options, xmlModule);
    }
  };
}

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
      target.set(
        "examples",
        examples.map((example) => serializeValueAsJson(program, example.value, type)),
      );
    }
  }

  applyCustomConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    target: ObjectBuilder<OpenAPISchema3_1>,
    refSchema?: OpenAPISchema3_1,
  ) {
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

    this.#applySchemaExamples(program, type, target);
  }

  enumSchema(en: Enum): OpenAPISchema3_1 {
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

    const schema: OpenAPISchema3_1 = {
      type: enumTypes.values().next().value!,
      enum: [...enumValues],
    };

    return this.applyConstraints(en, schema);
  }
  unionSchema(union: Union): ObjectBuilder<OpenAPISchema3_1> {
    const program = this.emitter.getProgram();
    if (union.variants.size === 0) {
      reportDiagnostic(program, { code: "empty-union", target: union });
      return new ObjectBuilder({});
    }
    const variants = Array.from(union.variants.values());
    const literalVariantEnumByType: Record<string, any[]> = {};
    const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
    const schemaMembers: { schema: any; type: Type | null }[] = [];
    const discriminator = getDiscriminator(program, union);
    const isMultipart = this.getContentType().startsWith("multipart/");

    for (const variant of variants) {
      if (isNullType(variant.type)) {
        this.intrinsic(variant.type, "null");
        schemaMembers.push({ schema: { type: "null" }, type: variant.type });
        continue;
      }

      if (isMultipart && isBytesKeptRaw(program, variant.type)) {
        schemaMembers.push({ schema: { type: "string", format: "binary" }, type: variant.type });
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
    ): ObjectBuilder<OpenAPISchema3_1> => {
      // we can just return the single schema member after applying nullable
      const schema = schemaMember.schema;
      const type = schemaMember.type;
      const additionalProps: Partial<OpenAPISchema3_1> = mergeUnionWideConstraints
        ? this.applyConstraints(union, {})
        : {};

      if (Object.keys(additionalProps).length === 0) {
        return new ObjectBuilder(schema);
      } else {
        if (
          (schema instanceof Placeholder || "$ref" in schema) &&
          !(type && shouldInline(program, type))
        ) {
          if (type && (type.kind === "Model" || type.kind === "Scalar")) {
            return new ObjectBuilder({
              type: "object",
              allOf: Builders.array([schema]),
              ...additionalProps,
            });
          } else {
            return new ObjectBuilder({ allOf: Builders.array([schema]), ...additionalProps });
          }
        } else {
          const merged = new ObjectBuilder<OpenAPISchema3_1>(schema);
          for (const [key, value] of Object.entries(additionalProps)) {
            merged.set(key, value);
          }
          return merged;
        }
      }
    };

    if (schemaMembers.length === 0) {
      compilerAssert(false, "Attempting to emit an empty union");
    }

    if (schemaMembers.length === 1) {
      return wrapWithObjectBuilder(schemaMembers[0], { mergeUnionWideConstraints: true });
    }

    const isMerge = false; // checkMerge(schemaMembers);
    const schema: OpenAPISchema3_1 = {
      [ofType]: schemaMembers.map((m) =>
        wrapWithObjectBuilder(m, { mergeUnionWideConstraints: isMerge }),
      ),
    };

    if (discriminator) {
      // the decorator validates that all the variants will be a model type
      // with the discriminator field present.
      schema.discriminator = { ...discriminator };
      // Diagnostic already reported in compiler for unions
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(union, discriminator));
      if (discriminatedUnion.variants.size > 0) {
        schema.discriminator.mapping = this.getDiscriminatorMapping(discriminatedUnion);
      }
    }

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
}
