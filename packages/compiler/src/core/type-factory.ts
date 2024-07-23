import { createRekeyableMap } from "../utils/misc.js";
import { Numeric } from "./numeric.js";
import { Program } from "./program.js";
import { Realm } from "./realm.js";
import {
  BooleanLiteral,
  DecoratorApplication,
  DecoratorFunction,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  RekeyableMap,
  Scalar,
  StringLiteral,
  Type,
  Union,
  UnionVariant,
} from "./types.js";
type DecoratorArgs = DecoratorFunction | [DecoratorFunction, ...any[]];

interface ScalarOptions {
  extends?: Scalar;
  namespace?: Namespace;
}

interface ModelOptions {
  extends?: Model;
  namespace?: Namespace;
}

interface ModelPropertyOptions {
  optional?: boolean;
}

interface UnionVariantOptions {
  union?: Union;
}

export function createTypeFactory(program: Program, realm?: Realm) {
  const nostdlib = program.compilerOptions.nostdlib;
  const F = {
    literal(value: string | number | boolean | null) {
      switch (typeof value) {
        case "string":
          return this.stringLiteral(value);
        case "boolean":
          return this.booleanLiteral(value);
        case "number":
          return this.numericLiteral(value);
        default:
          if (value === null) {
            return this.null;
          }
          throw new Error(`Unknown literal type ${typeof value}`);
      }
    },

    stringLiteral(value: string): StringLiteral {
      return program.checker.createType({
        kind: "String",
        value,
      });
    },
    booleanLiteral(value: boolean): BooleanLiteral {
      return program.checker.createType({
        kind: "Boolean",
        value,
      });
    },
    numericLiteral(value: number): NumericLiteral {
      const valueAsString = String(value);
      return program.checker.createType({
        kind: "Number",
        value,
        valueAsString,
        numericValue: Numeric(valueAsString),
      });
    },

    scalar(
      ...args: [...DecoratorArgs[], string, ScalarOptions] | [...DecoratorArgs[], string]
    ): Scalar {
      const opts = extractArgs<never, ScalarOptions>(args, false);
      const type: Scalar = program.checker.createType({
        kind: "Scalar",
        decorators: opts.decorators,
        name: opts.name!,
        derivedScalars: [],
        baseScalar: opts.options.extends,
        node: undefined as any, //todo: update this type?
        constructors: new Map(),
        namespace: opts.options.namespace, //todo: should default to global namespace
      });

      finishType(type);
      return type;
    },

    model(
      ...args:
        | [...DecoratorArgs[], string, ModelProperty[], ModelOptions]
        | [...DecoratorArgs[], string, ModelProperty[]]
    ): Model {
      const opts = extractArgs<ModelProperty[], ModelOptions>(args);

      const model: Model = program.checker.createType({
        kind: "Model",
        name: opts.name!,
        decorators: opts.decorators,
        properties: createRekeyableMap(opts.body.map((p) => [p.name, p])),
        indexer: undefined,
        baseModel: opts.options.extends,
        namespace: opts.options.namespace,
        node: undefined as any,
        derivedModels: [],
        sourceModels: [],
      });

      finishType(model);

      return model;
    },

    modelProperty(
      ...args:
        | [...DecoratorArgs[], string, Type, ModelPropertyOptions]
        | [...DecoratorArgs[], string, Type]
    ): ModelProperty {
      const opts = extractArgs<ModelProperty, ModelPropertyOptions>(args);
      const property: ModelProperty = program.checker.createType({
        kind: "ModelProperty",
        name: opts.name!,
        decorators: opts.decorators,
        type: opts.body,
        node: undefined as any,
        optional: !!opts.options.optional,
      });

      finishType(property);
      return property;
    },

    union(...args: [...DecoratorArgs[], Type[] | UnionVariant[]]): Union {
      const opts = extractArgs<UnionVariant[] | Type[], ScalarOptions>(args);

      const union: Union = program.checker.createType({
        kind: "Union",
        name: opts.name,
        decorators: opts.decorators,
        variants: createRekeyableMap(),
        get options() {
          return Array.from(this.variants.values()).map((v) => v.type);
        },
        expression: opts.name === undefined,
        node: undefined as any,
      });

      if (opts.body[0].kind === "UnionVariant") {
        for (const variant of opts.body as UnionVariant[]) {
          union.variants.set(variant.name, variant);
          variant.union = union;
        }
      } else {
        for (const variantType of opts.body as Type[]) {
          const variant = this.unionVariant(variantType);
          variant.union = union;
          union.variants.set(variant.name, variant);
        }
      }

      finishType(union);

      return union;
    },

    unionVariant(
      ...args:
        | [...DecoratorArgs[], string | symbol, Type, UnionVariantOptions]
        | [...DecoratorArgs[], Type, UnionVariantOptions]
        | [...DecoratorArgs[], string | symbol, Type]
        | [...DecoratorArgs[], Type]
    ): UnionVariant {
      const opts = extractArgs<Type, UnionVariantOptions>(args);
      const type: UnionVariant = program.checker.createType({
        kind: "UnionVariant",
        name: opts.name ?? Symbol("name"),
        decorators: opts.decorators,
        type: opts.body,
        node: undefined as any, // todo, fix node?
        union: opts.options.union as any,
      });
      finishType(type);

      return type;
    },

    initializeClone<T extends Type>(type: T): T {
      let clone: T;
      switch (type.kind) {
        case "Model":
          clone = program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            properties: copyMap(type.properties),
            indexer: type.indexer
              ? {
                  ...type.indexer,
                }
              : undefined,
          });
          break;

        case "Union":
          clone = program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            variants: copyMap(type.variants),
            get options() {
              return Array.from(this.variants.values()).map((v: any) => v.type);
            },
          });
          break;

        case "Interface":
          clone = program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            operations: copyMap(type.operations),
          });
          break;

        case "Enum":
          clone = program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            members: copyMap(type.members),
          });
          break;
        default:
          clone = program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }

      realm?.addType(clone);
      return clone;
    },

    finishType(type: Type) {
      finishType(type);
    },
    null: nostdlib ? (null as any) : program.checker.nullType,
    never: nostdlib ? (null as any) : program.checker.neverType,
    string: nostdlib ? (null as any) : program.checker.getStdType("string"),
    globalNamespace: program.getGlobalNamespaceType(),
  };

  return F;

  function finishType(type: Type) {
    program.checker.finishType(type, realm);
  }

  function copyMap<T, U>(map: RekeyableMap<T, U>): RekeyableMap<T, U> {
    return createRekeyableMap(Array.from(map.entries()));
  }

  function extractArgs<TBody, TOptions>(
    args: any[],
    noBody = false
  ): {
    decorators: DecoratorApplication[];
    name: string | undefined;
    body: TBody;
    options: TOptions;
  } {
    let index = 0;
    const decoratorArgs = takeWhile(
      (arg) => typeof arg === "function" || (Array.isArray(arg) && typeof arg[0] === "function")
    );
    const decorators: DecoratorApplication[] = [];
    for (const arg of decoratorArgs) {
      decorators.push({
        decorator: arg[0],
        args: arg.slice(1).map((rawValue: any) => ({
          value: typeof rawValue === "object" && rawValue !== null ? rawValue : F.literal(rawValue),
          jsValue: rawValue,
        })),
      });
    }

    return {
      decorators,
      name: takeWhile((arg) => typeof arg === "string" || typeof arg === "symbol")[0],
      body: takeWhile((arg) => true && !noBody)[0],
      options: takeWhile((arg) => true)[0] ?? {},
    };

    function takeWhile(predicate: (arg: any) => boolean) {
      const output: any[] = [];
      const item = args[index];
      if (predicate(item)) {
        output.push(item);
        index++;
      }
      return output;
    }
  }
}
