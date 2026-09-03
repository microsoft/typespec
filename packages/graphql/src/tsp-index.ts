import type { TypeSpecGraphQLDecorators } from "../generated-defs/TypeSpec.GraphQL.js";
import { $lib } from "./lib.js";
import { $compose, $graphqlInterface } from "./lib/interface.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $mutation, $query, $subscription } from "./lib/operation-kind.js";
import { $schema } from "./lib/schema.js";
import { $specifiedBy } from "./lib/specified-by.js";
import { $onValidate } from "./validate.js";

export { $lib, $onValidate };

export const $decorators = {
  "TypeSpec.GraphQL": {
    compose: $compose,
    graphqlInterface: $graphqlInterface,
    mutation: $mutation,
    operationFields: $operationFields,
    query: $query,
    schema: $schema,
    specifiedBy: $specifiedBy,
    subscription: $subscription,
  } satisfies TypeSpecGraphQLDecorators,
};
