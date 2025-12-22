import {
  ArrayBuilder,
  AssetEmitter,
  createAssetEmitter,
  ObjectBuilder,
  TypeEmitter,
} from "@typespec/asset-emitter";
import { compilerAssert, DiscriminatedUnion, Type } from "@typespec/compiler";
import { MetadataInfo } from "@typespec/http";
import { JsonSchemaModule } from "./json-schema.js";
import { OpenAPI3EmitterOptions } from "./lib.js";
import { CreateSchemaEmitter } from "./openapi-spec-mappings.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { OpenAPI31SchemaEmitter } from "./schema-emitter-3-1.js";
import { OpenAPIDiscriminator3_2, OpenAPISchema3_2 } from "./types.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

function createWrappedSchemaEmitterClass(
  metadataInfo: MetadataInfo,
  visibilityUsage: VisibilityUsageTracker,
  options: ResolvedOpenAPI3EmitterOptions,
  optionalDependencies: { jsonSchemaModule?: JsonSchemaModule; xmlModule?: XmlModule },
): typeof TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions> {
  return class extends OpenAPI32SchemaEmitter {
    constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
      super(emitter, metadataInfo, visibilityUsage, options, optionalDependencies);
    }
  };
}

export const createSchemaEmitter3_2: CreateSchemaEmitter = ({ program, context, ...rest }) => {
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
 * OpenAPI 3.2 schema emitter. Deals with emitting content of `components/schemas` section.
 * Extends OpenAPI 3.1 emitter with additional support for OpenAPI 3.2 features.
 */
export class OpenAPI32SchemaEmitter extends OpenAPI31SchemaEmitter {
  discriminatedUnion(union: DiscriminatedUnion): ObjectBuilder<OpenAPISchema3_2> {
    let schema: any;
    if (union.options.envelope === "none") {
      const items = new ArrayBuilder();
      
      // Add named variants to the oneOf array
      for (const variant of union.variants.values()) {
        items.push(this.emitter.emitTypeReference(variant));
      }

      // Add default variant to the oneOf array if it exists
      if (union.defaultVariant) {
        items.push(this.emitter.emitTypeReference(union.defaultVariant));
      }

      // Build discriminator with mapping for named variants
      const mapping = this.getDiscriminatorMapping(union.variants);
      const discriminator: OpenAPIDiscriminator3_2 = {
        propertyName: union.options.discriminatorPropertyName,
        mapping,
      };

      // Add defaultMapping if there's a default variant
      if (union.defaultVariant) {
        const defaultRef = this.emitter.emitTypeReference(union.defaultVariant);
        compilerAssert(
          defaultRef.kind === "code",
          "Unexpected default ref schema. Should be kind: code",
        );
        discriminator.defaultMapping = (defaultRef.value as any).$ref;
      }

      schema = {
        type: "object",
        oneOf: items,
        discriminator,
      };
    } else {
      // For envelope variants, delegate to parent class implementation
      // as the default variant handling with envelopes is not yet specified in the issue
      return super.discriminatedUnion(union);
    }

    return this.applyConstraints(union.type, schema);
  }

  getDiscriminatorMapping(variants: Map<string, Type>) {
    const mapping: Record<string, string> | undefined = {};
    for (const [key, model] of variants.entries()) {
      const ref = this.emitter.emitTypeReference(model);
      compilerAssert(ref.kind === "code", "Unexpected ref schema. Should be kind: code");
      mapping[key] = (ref.value as any).$ref;
    }
    return mapping;
  }
}
