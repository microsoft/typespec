import { camelCase, kebabCase, pascalCase, snakeCase } from "change-case";
import type { Checker } from "./checker.js";
import { ProjectionError, assertType } from "./diagnostics.js";
import type { ObjectType, Type, UnionVariant } from "./types.js";

export function createProjectionMembers(checker: Checker): {
  [TKind in Type["kind"]]?: Record<string, (base: Type & { kind: TKind }) => Type>;
} {
  const { voidType, neverType, createType, createFunctionType, createLiteralType } = checker;

  function createBaseMembers<T extends Type>() {
    return {
      projectionSource: (base: T) => base.projectionSource ?? voidType,
      projectionBase: (base: T) => base.projectionBase ?? voidType,
    };
  }
  function createNameableMembers<T extends Type & { name?: string }>() {
    return {
      name: (base: T) => (base.name ? createLiteralType(base.name) : voidType),
      rename: (base: T) => {
        return createFunctionType((newName: Type) => {
          assertType("new name", newName, "String");

          base.name = newName.value;
          return voidType;
        });
      },
    };
  }

  return {
    Model: {
      ...createBaseMembers(),
      ...createNameableMembers(),
      properties(base) {
        return createType({
          kind: "Object",
          properties: {
            forEach: createFunctionType((block: Type) => {
              assertType("block", block, "Function");
              const props = Array.from(base.properties.values());
              props.forEach((p) => block.implementation(p));
              return voidType;
            }),
          },
        }) as ObjectType;
      },
      renameProperty(base) {
        return createFunctionType((oldNameT: Type, newNameT: Type) => {
          assertType("current property name", oldNameT, "String");
          assertType("new property name", newNameT, "String");
          const oldName = oldNameT.value;
          const newName = newNameT.value;

          const prop = base.properties.get(oldName);
          if (!prop) {
            throw new ProjectionError(`Property ${oldName} not found`);
          }

          prop.name = newName;
          base.properties.rekey(oldName, newName);

          return voidType;
        });
      },
      changePropertyType(base) {
        return createFunctionType((nameT: Type, newType: Type) => {
          assertType("property name", nameT, "String");
          const propertyName = nameT.value;

          const prop = base.properties.get(propertyName);
          if (!prop) {
            throw new ProjectionError(`Property ${propertyName} not found`);
          }
          prop.type = newType;

          return voidType;
        });
      },
      addProperty(base) {
        return createFunctionType((nameT: Type, type: Type, defaultT: Type) => {
          assertType("property", nameT, "String");
          const name = nameT.value;
          const prop = base.properties.get(name);
          if (prop) {
            throw new ProjectionError(`Property ${name} already exists`);
          }

          base.properties.set(
            name,
            createType({
              kind: "ModelProperty",
              name,
              optional: false,
              decorators: [],
              node: undefined!,
              default: defaultT,
              type,
            }),
          );

          return voidType;
        });
      },
      deleteProperty(base) {
        return createFunctionType((nameT: Type) => {
          assertType("property", nameT, "String");
          const name = nameT.value;
          const prop = base.properties.get(name);
          if (!prop) {
            return voidType;
          }
          base.properties.delete(name);
          return voidType;
        });
      },
    },
    ModelProperty: {
      ...createBaseMembers(),
      name(base) {
        return createLiteralType(base.name);
      },
      type(base) {
        return base.type;
      },
      setType(base) {
        return createFunctionType((t: Type) => {
          base.type = t;
          return voidType;
        });
      },
      setOptional(base) {
        return createFunctionType((optional: Type) => {
          assertType("Optional", optional, "Boolean");
          base.optional = optional.value;
          return voidType;
        });
      },
    },
    Scalar: {
      ...createBaseMembers(),
      ...createNameableMembers(),
    },
    Union: {
      ...createBaseMembers(),
      ...createNameableMembers(),
      variants(base) {
        return createType({
          kind: "Object",
          properties: {
            forEach: createFunctionType((block: Type) => {
              assertType("block", block, "Function");
              const variants = Array.from(base.variants.values());
              variants.forEach((p) => block.implementation(p));
              return voidType;
            }),
          },
        }) as ObjectType;
      },
      renameVariant(base) {
        return createFunctionType((oldNameT: Type, newNameT: Type) => {
          assertType("old variant name", oldNameT, "String");
          assertType("new variant name", newNameT, "String");
          const oldName = oldNameT.value;
          const newName = newNameT.value;

          const variant = base.variants.get(oldName);
          if (!variant) {
            throw new ProjectionError(`Couldn't find variant ${variant}`);
          }
          base.variants.rekey(oldName, newName);
          variant.name = newName;

          return voidType;
        });
      },
      addVariant(base) {
        return createFunctionType((nameT: Type, type: Type) => {
          assertType("Variant name", nameT, "String");
          const name = nameT.value;
          const variantType: UnionVariant = createType({
            kind: "UnionVariant",
            decorators: [],
            name,
            node: undefined,
            type,
            union: base,
          });
          base.variants.set(name, variantType);
          return voidType;
        });
      },
      deleteVariant(base) {
        return createFunctionType((nameT: Type) => {
          assertType("Name", nameT, "String");
          const name = nameT.value;
          base.variants.delete(name);
          return voidType;
        });
      },
    },
    UnionVariant: {
      ...createBaseMembers(),
      name(base) {
        if (typeof base.name === "string") {
          return createLiteralType(base.name);
        } else {
          throw new ProjectionError("Can't refer to name of anonymous union variant");
        }
      },
      setType(base) {
        return createFunctionType((type: Type) => {
          base.type = type;
          return voidType;
        });
      },
      type(base) {
        return base.type;
      },
    },
    Operation: {
      ...createBaseMembers(),
      ...createNameableMembers(),
      parameters(base) {
        return base.parameters;
      },
      returnType(base) {
        return base.returnType;
      },
      changeReturnType(base) {
        return createFunctionType((newType: Type) => {
          base.returnType = newType;
          return voidType;
        });
      },
    },
    Interface: {
      ...createBaseMembers(),
      ...createNameableMembers(),
      operations(base) {
        return createType({
          kind: "Object",
          properties: {
            forEach: createFunctionType((block: Type) => {
              assertType("block", block, "Function");
              const props = Array.from(base.operations.values());
              props.forEach((p) => block.implementation(p));
              return voidType;
            }),
          },
        });
      },
      renameOperation(base) {
        return createFunctionType((oldNameT: Type, newNameT: Type) => {
          assertType("operation name", oldNameT, "String");
          assertType("operation name", newNameT, "String");
          const oldName = oldNameT.value;
          const newName = newNameT.value;

          const op = base.operations.get(oldName);
          if (!op) {
            throw new ProjectionError(`Couldn't find operation named ${oldName}`);
          }
          op.name = newName;
          base.operations.rekey(oldName, newName);
          return voidType;
        });
      },
      addOperation(base) {
        return createFunctionType((nameT: Type, parameters: Type, returnType: Type) => {
          assertType("operation name", nameT, "String");
          assertType("parameters", parameters, "Model");
          const name = nameT.value;
          const prop = base.operations.get(name);
          if (prop) {
            throw new ProjectionError(`Operation named ${name} already exists`);
          }

          base.operations.set(
            name,
            createType({
              kind: "Operation",
              name,
              node: undefined!,
              parameters,
              returnType,
              decorators: [],
            }),
          );
          return voidType;
        });
      },
      deleteOperation(base) {
        return createFunctionType((nameT: Type) => {
          assertType("operation name", nameT, "String");
          const name = nameT.value;

          const prop = base.operations.get(name);
          if (!prop) {
            return voidType;
          }
          base.operations.delete(name);

          return voidType;
        });
      },
    },
    Enum: {
      ...createBaseMembers(),
      ...createNameableMembers(),
      members(base) {
        return createType({
          kind: "Object",
          properties: {
            forEach: createFunctionType((block: Type) => {
              assertType("parameter", block, "Function");
              const props = Array.from(base.members.values());
              props.forEach((p) => block.implementation(p));
              return voidType;
            }),
          },
        });
      },
      name(base) {
        return createLiteralType(base.name);
      },
      addMember(base) {
        return createFunctionType((nameT: Type, type?: Type) => {
          assertType("enum member", nameT, "String");
          type && assertType("enum type", type, "String", "Number");

          const name = nameT.value;
          const member = base.members.get(name);
          if (member) {
            throw new ProjectionError(`Enum already has a member named ${name}`);
          }

          if (type !== undefined && type.kind !== "Number" && type.kind !== "String") {
            throw new ProjectionError(`Enum member types must be string or number`);
          }

          base.members.set(
            name,
            createType({
              kind: "EnumMember",
              enum: base,
              name,
              decorators: [],
              node: undefined!,
              value: type ? type.value : undefined,
            }),
          );

          return voidType;
        });
      },
      deleteMember(base) {
        return createFunctionType((nameT: Type) => {
          assertType("enum member", nameT, "String");

          const name = nameT.value;

          base.members.delete(name);
          return voidType;
        });
      },
      renameMember(base) {
        return createFunctionType((oldNameT: Type, newNameT: Type) => {
          assertType("enum member", oldNameT, "String");
          assertType("enum member", newNameT, "String");

          const oldName = oldNameT.value;
          const newName = newNameT.value;

          const member = base.members.get(oldName);
          if (!member) {
            throw new ProjectionError(`Enum doesn't have member ${oldName}`);
          }
          member.name = newName;
          base.members.rekey(oldName, newName);
          return voidType;
        });
      },
    },
    EnumMember: {
      ...createBaseMembers(),
      name(base) {
        return createLiteralType(base.name);
      },
      type(base) {
        return base.value ? createLiteralType(base.value) : neverType;
      },
    },
    String: {
      toCamelCase(base) {
        return createFunctionType(() => {
          return createLiteralType(camelCase(base.value));
        });
      },
      toPascalCase(base) {
        return createFunctionType(() => {
          return createLiteralType(pascalCase(base.value));
        });
      },
      toSnakeCase(base) {
        return createFunctionType(() => {
          return createLiteralType(snakeCase(base.value));
        });
      },
      toKebabCase(base) {
        return createFunctionType(() => {
          return createLiteralType(kebabCase(base.value));
        });
      },
    },
  };
}
