import {
  type DiagnosticTarget,
  type Enum,
  isNullType,
  type Model,
  type Namespace,
  navigateTypesInNamespace,
  type Operation,
  type Program,
  type Union,
} from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";
import { getOperationKind } from "./lib/operation-kind.js";
import { listSchemas } from "./lib/schema.js";

export function $onValidate(program: Program) {
  const schemas = listSchemas(program);

  // Only validate if there are explicit @schema decorators
  // Tests and other usages without @schema should not trigger validation warnings
  if (schemas.length === 0) {
    return;
  }

  for (const schema of schemas) {
    validateSchema(program, schema.type);
  }
}

function validateSchema(program: Program, ns: Namespace) {
  let hasGraphQLOps = false;

  navigateTypesInNamespace(ns, {
    operation(op) {
      if (getOperationKind(program, op) !== undefined) {
        hasGraphQLOps = true;
      }
      validateOperation(program, op);
    },
    model(model) {
      validateModel(program, model);
    },
    enum(enumType) {
      validateEnum(program, enumType);
    },
    union(unionType) {
      validateUnion(program, unionType);
    },
  });

  if (!hasGraphQLOps) {
    reportDiagnostic(program, {
      code: "empty-schema",
      target: ns,
    });
  }
}

/**
 * GraphQL spec: Names must not begin with "__" (two underscores).
 * https://spec.graphql.org/September2025/#sec-Names.Reserved-Names
 */
function validateReservedName(program: Program, name: string, target: DiagnosticTarget) {
  if (name.startsWith("__")) {
    reportDiagnostic(program, {
      code: "reserved-name",
      format: { name },
      target,
    });
  }
}

/**
 * Validate model: check type name and property names for reserved prefix.
 */
function validateModel(program: Program, model: Model) {
  // Check model name
  if (model.name) {
    validateReservedName(program, model.name, model);
  }

  // Check property names
  for (const prop of model.properties.values()) {
    validateReservedName(program, prop.name, prop);
  }
}

/**
 * Validate operation: check operation name and parameter names for reserved prefix.
 */
function validateOperation(program: Program, op: Operation) {
  // Validate operation name (becomes a GraphQL field name on Query/Mutation/Subscription)
  validateReservedName(program, op.name, op);

  // Validate parameter names
  for (const param of op.parameters.properties.values()) {
    validateReservedName(program, param.name, param);
  }
}

/**
 * Validate union: check type name for reserved prefix and empty unions.
 * https://spec.graphql.org/September2025/#sec-Unions
 */
function validateUnion(program: Program, unionType: Union) {
  // Only validate named unions (not anonymous unions like `string | null`)
  if (!unionType.name) {
    return;
  }

  validateReservedName(program, unionType.name, unionType);

  // Check for empty union: no variants, or all variants are null.
  // GraphQL unions must have at least one member type.
  const nonNullVariants = [...unionType.variants.values()].filter((v) => !isNullType(v.type));

  if (nonNullVariants.length === 0) {
    reportDiagnostic(program, {
      code: "empty-union",
      target: unionType,
    });
  }
}

/**
 * GraphQL spec: Enums must define at least one value.
 * https://spec.graphql.org/September2025/#sec-Enums
 */
function validateEnum(program: Program, enumType: Enum) {
  // Check enum name
  if (enumType.name) {
    validateReservedName(program, enumType.name, enumType);
  }

  // Check enum member names
  for (const member of enumType.members.values()) {
    validateReservedName(program, member.name, member);
  }

  // Check for empty enum
  if (enumType.members.size === 0) {
    reportDiagnostic(program, {
      code: "empty-enum",
      format: { name: enumType.name },
      target: enumType,
    });
  }
}
