import {
  createDiagnosticCollector,
  navigateTypesInNamespace,
  type Diagnostic,
  type DiagnosticCollector,
  type EmitContext,
  type Model,
} from "@typespec/compiler";
import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLSchema,
  validateSchema,
  type GraphQLSchemaConfig,
} from "graphql";
import { type GraphQLEmitterOptions } from "./lib.js";
import type { Schema } from "./lib/schema.js";

class GraphQLSchemaEmitter {
  private tspSchema: Schema;
  private context: EmitContext<GraphQLEmitterOptions>;
  private options: GraphQLEmitterOptions;
  private diagnostics: DiagnosticCollector;
  constructor(
    tspSchema: Schema,
    context: EmitContext<GraphQLEmitterOptions>,
    options: GraphQLEmitterOptions,
  ) {
    // Initialize any properties if needed, including the registry
    this.tspSchema = tspSchema;
    this.context = context;
    this.options = options;
    this.diagnostics = createDiagnosticCollector();
  }

  async emitSchema(): Promise<[GraphQLSchema, Readonly<Diagnostic[]>] | undefined> {
    const schemaNamespace = this.tspSchema.type;
    // Logic to emit the GraphQL schema
    navigateTypesInNamespace(schemaNamespace, this.semanticNodeListener());
    // Replace this with the actual schema config that should be derived from the registry
    // something like: registry.materializeSchemaConfig();
    const schemaConfig: GraphQLSchemaConfig = {
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          _: {
            type: GraphQLBoolean,
            description:
              "A placeholder field. If you are seeing this, it means no operations were defined that could be emitted.",
          },
        },
      }),
    };
    const schema = new GraphQLSchema(schemaConfig);
    // validate the schema
    const validationErrors = validateSchema(schema);
    validationErrors.forEach((error) => {
      this.diagnostics.add({
        message: error.message,
        code: "GraphQLSchemaValidationError",
        target: this.tspSchema.type,
        severity: "error",
      });
    });
    return [schema, this.diagnostics.diagnostics];
  }

  semanticNodeListener() {
    // TODO: Add GraphQL types to registry as the TSP nodes are visited
    return {
      model: (model: Model) => {
        {
        }
      },
    };
  }
}

export function createSchemaEmitter(
  schema: Schema,
  context: EmitContext<GraphQLEmitterOptions>,
  options: GraphQLEmitterOptions,
): GraphQLSchemaEmitter {
  // Placeholder for creating a GraphQL schema emitter
  return new GraphQLSchemaEmitter(schema, context, options);
}

export type { GraphQLSchemaEmitter };
