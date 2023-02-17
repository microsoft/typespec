// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DiagnosticTarget,
  Enum,
  EnumMember,
  getEffectiveModelType,
  getTypeName,
  Interface,
  isDeclaredInNamespace,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  resolvePath,
  Scalar,
  StringLiteral,
  SyntaxKind,
  Type,
  Union,
} from "@typespec/compiler";
import {
  map,
  matchType,
  ProtoEnumDeclaration,
  ProtoFieldDeclaration,
  ProtoFile,
  ProtoMap,
  ProtoMessageBodyDeclaration,
  ProtoMessageDeclaration,
  ProtoMethodDeclaration,
  ProtoOneOfDeclaration,
  ProtoRef,
  ProtoScalar,
  ProtoTopLevelDeclaration,
  ProtoType,
  ref,
  scalar,
  ScalarIntegralName,
  StreamingMode,
  unreachable,
} from "./ast.js";
import { ProtobufEmitterOptions, reportDiagnostic, state } from "./lib.js";
import { $field, isMap, Reservation } from "./proto.js";
import { writeProtoFile } from "./write.js";

// Cache for scalar -> ProtoScalar map
let _protoScalarsMap: Map<Type, ProtoScalar>;

/**
 * Create a worker function that converts the TypeSpec program to Protobuf and writes it to the file system.
 */
export function createProtobufEmitter(
  program: Program
): (outDir: string, options: ProtobufEmitterOptions) => Promise<void> {
  return async function doEmit(outDir, options) {
    // Convert the program to a set of proto files.
    const files = tspToProto(program);

    if (!program.compilerOptions.noEmit && !options?.noEmit && !program.hasError()) {
      for (const file of files) {
        // If the file has a package, emit it to a path that is shaped like the package name. Otherwise emit to
        // main.proto

        // Collisions have already been detected.

        const packageSlug = file.package?.split(".") ?? ["main"];
        const filePath = resolvePath(outDir, ...packageSlug.slice(0, -1));

        await program.host.mkdirp(filePath);
        await program.host.writeFile(
          resolvePath(filePath, packageSlug[packageSlug.length - 1] + ".proto"),
          writeProtoFile(file)
        );
      }
    }
  };
}

/**
 * Create a set of proto files that represent the TypeSpec program.
 *
 * This is the meat of the emitter.
 */
function tspToProto(program: Program): ProtoFile[] {
  const packages = new Set<Namespace>(
    program.stateMap(state.package).keys() as Iterable<Namespace>
  );

  const serviceInterfaces = [...(program.stateSet(state.service) as Set<Interface>)];

  const declarationMap = new Map<Namespace, ProtoTopLevelDeclaration[]>(
    [...packages].map((p) => [p, []])
  );

  const visitedTypes = new Set<Type>();

  /**
   * Visits a model type, converting it into a message definition and adding it if it has not already been visited.
   * @param model - the model type to consider
   */
  function visitModel(model: Model) {
    const modelPackage = getPackageOfType(program, model);
    const declarations = modelPackage && declarationMap.get(modelPackage);
    if (!visitedTypes.has(model)) {
      visitedTypes.add(model);
      declarations?.push(toMessage(model));
    }
  }

  /**
   * Visits an enum type, converting it into a Protobuf enum definition and adding it if it has not already been visited.
   */
  function visitEnum(e: Enum) {
    const modelPackage = getPackageOfType(program, e);
    const declarations = modelPackage && declarationMap.get(modelPackage);
    if (!visitedTypes.has(e)) {
      visitedTypes.add(e);

      const members = [...e.members.values()];

      // We only support enums where every variant is explicitly assigned an integer value
      if (
        members.some(
          ({ value: v }) => v === undefined || typeof v !== "number" || !Number.isInteger(v)
        )
      ) {
        reportDiagnostic(program, {
          target: e,
          code: "unconvertible-enum",
        });
      }

      // we also only support enums where the first value is zero.
      if (members[0].value !== 0) {
        reportDiagnostic(program, {
          target: getMemberTypeSyntaxTarget(members[0]),
          code: "unconvertible-enum",
          messageId: "no-zero-first",
        });
      }

      declarations?.push(toEnum(e));
    }
  }

  const importMap = new Map([...packages].map((ns) => [ns, new Set<string>()]));

  function typeWantsImport(program: Program, t: Model | Operation, path: string) {
    const packageNs = getPackageOfType(program, t);

    if (packageNs) {
      importMap.get(packageNs)?.add(path);
    }
  }

  const mapImportSourceInformation = new WeakMap<
    ProtoMap,
    [Model | Operation, NamespaceTraversable]
  >();

  const effectiveModelCache = new Map<Model, Model | undefined>();

  for (const packageNs of packages) {
    addDeclarationsOfPackage(packageNs);
  }

  // Emit a file per package.
  const files = [...packages].map((namespace) => {
    const details = program.stateMap(state.package).get(namespace) as Model | undefined;
    return {
      package: (
        (details?.properties.get("name") as ModelProperty | undefined)?.type as
          | StringLiteral
          | undefined
      )?.value,

      // TODO: The language guide is really unclear about how to handle these. We may also need a facility for
      // allowing packages to declare extensions, as extensions may be target/compiler specific.
      options: {},

      imports: [...(importMap.get(namespace) ?? [])],

      declarations: declarationMap.get(namespace),
      source: namespace,
    } as ProtoFile;
  });

  checkForNamespaceCollisions(files);

  return files;

  /**
   * Recursively searches a namespace for declarations that should be reified as Protobuf.
   *
   * @param namespace - the namespace to analyze
   * @returns an array of declarations
   */
  function addDeclarationsOfPackage(namespace: Namespace) {
    const interfacesInNamespace = new Set(
      serviceInterfaces.filter((iface) => isDeclaredInNamespace(iface, namespace))
    );

    // Each interface will be reified as a `service` declaration.
    const declarations = declarationMap.get(namespace)!;
    for (const iface of interfacesInNamespace) {
      declarations.push({
        kind: "service",
        name: iface.name,
        // The service's methods are just projections of the interface operations.
        operations: [...iface.operations.values()].map(toMethodFromOperation),
      });
    }
  }

  // #region inline helpers

  /**
   * @param operation - the operation to convert
   * @returns a corresponding method declaration
   */
  function toMethodFromOperation(operation: Operation): ProtoMethodDeclaration {
    const streamingMode = program.stateMap(state.stream).get(operation) ?? StreamingMode.None;

    return {
      kind: "method",
      stream: streamingMode,
      name: capitalize(operation.name),
      input: addImportSourceForProtoIfNeeded(
        program,
        addInputParams(operation.parameters, operation),
        operation,
        operation.parameters
      ),
      returns: addImportSourceForProtoIfNeeded(
        program,
        addReturnType(operation.returnType, operation),
        operation,
        operation.returnType as NamespaceTraversable
      ),
    };
  }

  /**
   * Checks a parameter Model satisfies the constraints for a Protobuf method input and adds it to the declarations,
   * returning a ProtoRef to the generated named message.
   *
   * @param model - the model to add
   * @returns a reference to the model's message
   */
  function addInputParams(paramsModel: Model, operation: Operation): ProtoRef {
    const effectiveModel = computeEffectiveModel(
      paramsModel,
      capitalize(operation.name) + "Request"
    );

    /* c8 ignore start */

    // Not sure if this can or can't actually happen at runtime, but we'll defensively handle it anyway.
    if (!effectiveModel) {
      reportDiagnostic(program, {
        code: "unsupported-input-type",
        messageId: "unconvertible",
        target: paramsModel,
      });

      return unreachable("unsupported input type");
    }
    /* c8 ignore stop */

    // TODO: I've written this way too many times
    const extern = program.stateMap(state.externRef).get(effectiveModel) as
      | [string, string]
      | undefined;
    if (extern) {
      typeWantsImport(program, operation, extern[0]);
      return ref(extern[1]);
    }

    return ref(effectiveModel.name);
  }

  /**
   * Checks that a return type is a Model and converts it to a message, adding it to the declarations and returning
   * a reference to its name.
   *
   * @param t - the model to add
   * @param operationName - the name of the originating operation, used to compute a synthetic model name if required
   * @returns a reference to the model's message
   */
  function addReturnType(t: Type, operation: Operation): ProtoRef {
    switch (t.kind) {
      case "Model":
        return addReturnModel(t, operation);
      case "Intrinsic":
        switch (t.name) {
          case "unknown":
            // We just use the built-in "unknown" type to mean the protobuf Any type
            return ref("Any");
          case "void": {
            const emptyRef = program.resolveTypeReference("TypeSpec.Protobuf.Empty")[0];
            if (emptyRef) {
              const externRef = program.stateMap(state.externRef).get(emptyRef) as [string, string];
              typeWantsImport(program, operation, externRef[0]);
              return ref(externRef[1]);
            }
          }
        }
      /* eslint-ignore-next-line no-fallthrough */
      default:
        // TODO: logic is duplicated in addReturnModel
        reportDiagnostic(program, {
          code: "unsupported-return-type",
          target: getOperationReturnSyntaxTarget(operation),
        });

        return unreachable("unsupported return type");
    }
  }

  /**
   * Converts a TypeSpec Model to a Protobuf Ref in return position, adding a corresponding message if necessary.
   *
   * @param m - the model to add to the Protofile.
   * @returns a Protobuf reference to the model
   */
  function addReturnModel(m: Model, operation: Operation): ProtoRef {
    const extern = program.stateMap(state.externRef).get(m) as [string, string] | undefined;
    if (extern) {
      typeWantsImport(program, operation, extern[0]);
      return ref(extern[1]);
    }

    const effectiveModel = computeEffectiveModel(m, capitalize(operation.name) + "Response");
    if (effectiveModel) {
      return ref(effectiveModel.name);
    }

    reportDiagnostic(program, {
      code: "unsupported-return-type",
      target: getOperationReturnSyntaxTarget(operation),
    });

    return unreachable("unsupported return type");
  }

  /**
   * Converts a TypeSpec type to a Protobuf type, adding a corresponding message if necessary.
   *
   * @param t - the type to add to the ProtoFile.
   * @returns a Protobuf type corresponding to the given type
   */
  function addType(t: Type, relativeSource: Model | Operation): ProtoType {
    // TODO: too much duplication with addReturnModel
    const extern = program.stateMap(state.externRef).get(t) as [string, string] | undefined;
    if (extern) {
      return ref(extern[1]);
    }

    if (isMap(program, t)) {
      const mapType = mapToProto(t as Model, relativeSource);
      mapImportSourceInformation.set(mapType, [relativeSource, t as NamespaceTraversable]);
      return mapType;
    }

    // Arrays transform into repeated fields, so we'll silently replace `t` with the array's member if this is an array.
    // The `repeated` keyword will be added when the field is composed.
    if (isArray(t)) {
      return arrayToProto(t as Model, relativeSource);
    }

    // TODO: reject anonymous models at this stage

    switch (t.kind) {
      case "Model":
        visitModel(t);
        return ref(t.name);
      case "Enum":
        visitEnum(t);
        return ref(t.name);
      case "Scalar":
        return scalarToProto(t);
      default:
        reportDiagnostic(program, {
          code: "unsupported-field-type",
          messageId: "unconvertible",
          format: {
            type: t.kind,
          },
          target: t,
        });
        return unreachable("unsupported field type");
    }
  }

  function mapToProto(t: Model, relativeSource: Model | Operation): ProtoMap {
    const [keyType, valueType] = t.templateMapper!.args;

    // A map's value cannot be another map.
    if (isMap(program, valueType)) {
      reportDiagnostic(program, {
        code: "unsupported-field-type",
        messageId: "recursive-map",
        target: valueType,
      });
      return unreachable("recursive map");
    }

    // This is a core compile error.
    if (!keyType || !valueType) return unreachable("nonexistent map key or value type");

    // TODO: key can be any integral or string type only
    const keyProto = addType(keyType, relativeSource);
    const valueProto = addType(valueType, relativeSource) as ProtoRef | ProtoScalar;

    return map(keyProto[1] as "string" | ScalarIntegralName, valueProto);
  }

  function arrayToProto(t: Model, relativeSource: Model | Operation): ProtoType {
    const valueType = (t as Model).templateMapper!.args[0];

    // Nested arrays are not supported.
    if (isArray(valueType)) {
      reportDiagnostic(program, {
        code: "nested-array",
        target: valueType,
      });
      return ref("<unreachable>");
    }

    return addType(valueType, relativeSource);
  }

  function getProtoScalarsMap(program: Program): Map<Type, ProtoScalar> {
    return (_protoScalarsMap ??= new Map<Type, ProtoScalar>(
      (
        [
          [program.resolveTypeReference("TypeSpec.bytes"), scalar("bytes")],
          [program.resolveTypeReference("TypeSpec.boolean"), scalar("bool")],
          [program.resolveTypeReference("TypeSpec.string"), scalar("string")],
          [program.resolveTypeReference("TypeSpec.int32"), scalar("int32")],
          [program.resolveTypeReference("TypeSpec.int64"), scalar("int64")],
          [program.resolveTypeReference("TypeSpec.uint32"), scalar("uint32")],
          [program.resolveTypeReference("TypeSpec.uint64"), scalar("uint64")],
          [program.resolveTypeReference("TypeSpec.float32"), scalar("float")],
          [program.resolveTypeReference("TypeSpec.float64"), scalar("double")],
          [program.resolveTypeReference("TypeSpec.Protobuf.sfixed32"), scalar("sfixed32")],
          [program.resolveTypeReference("TypeSpec.Protobuf.sfixed64"), scalar("sfixed64")],
          [program.resolveTypeReference("TypeSpec.Protobuf.sint32"), scalar("sint32")],
          [program.resolveTypeReference("TypeSpec.Protobuf.sint64"), scalar("sint64")],
          [program.resolveTypeReference("TypeSpec.Protobuf.fixed32"), scalar("fixed32")],
          [program.resolveTypeReference("TypeSpec.Protobuf.fixed64"), scalar("fixed64")],
        ] as [[Type, unknown], ProtoScalar][]
      ).map(([[type], scalar]) => [type, scalar])
    ));
  }

  function scalarToProto(t: Scalar): ProtoType {
    const fullName = getTypeName(t);

    const protoType = getProtoScalarsMap(program).get(t);

    if (!protoType) {
      reportDiagnostic(program, {
        code: "unsupported-field-type",
        messageId: "unknown-scalar",
        format: {
          name: fullName,
        },
        target: t,
      });
      return unreachable("unknown scalar");
    }

    return protoType;
  }

  function computeEffectiveModel(model: Model, anonymousModelName: string): Model | undefined {
    if (effectiveModelCache.has(model)) return effectiveModelCache.get(model);

    let effectiveModel = getEffectiveModelType(program, model);

    if (effectiveModel.name === "") {
      // Name the model automatically if it is anonymous
      effectiveModel = program.checker.createAndFinishType({
        ...model,
        name: anonymousModelName,
      });
    }

    if (!program.stateMap(state.externRef).has(effectiveModel)) {
      visitModel(effectiveModel);
    }

    effectiveModelCache.set(model, effectiveModel);

    return effectiveModel;
  }
  // #endregion

  function checkForNamespaceCollisions(files: ProtoFile[]) {
    const namespaces = new Set<string | undefined>();

    for (const file of files) {
      if (namespaces.has(file.package)) {
        reportDiagnostic(program, {
          code: "namespace-collision",
          format: {
            name: `"${file.package}"` ?? "<empty>",
          },
          target: file.source,
        });
      }

      namespaces.add(file.package);
    }
  }

  /**
   * @param model - the Model to convert
   * @returns a corresponding message declaration
   */
  function toMessage(model: Model): ProtoMessageDeclaration {
    return {
      kind: "message",
      name: model.name,
      reservations: program.stateMap(state.reserve).get(model),
      declarations: [...model.properties.values()].map((f) => toMessageBodyDeclaration(f, model)),
    };
  }

  /**
   * @param property - the ModelProperty to convert
   * @returns a corresponding declaration
   */
  function toMessageBodyDeclaration(
    property: ModelProperty,
    model: Model
  ): ProtoMessageBodyDeclaration {
    if (property.type.kind === "Union") {
      // TODO: union must have at least one variant.
      // TODO: union members must have field decorators.
      // TODO: union must be anonymous
      // TODO: union fields mustn't be arrays or maps.
      // TODO: union variants must be string-named

      // TODO: this isn't actually possible at all, because "union has named variants" and "union must be anonymous"
      // are currently contradictory, so we can temporarily allow union decls with the understanding that they will be
      // certainly inlined.

      const oneof: ProtoOneOfDeclaration = {
        kind: "oneof",
        name: property.name,
        declarations: [...property.type.variants.values()]
          .filter(/*TODO:*/ (v) => typeof v.name === "string")
          .map(
            (v): ProtoFieldDeclaration => ({
              kind: "field",
              name: v.name as string,
              index: program.stateMap(state.fieldIndex).get(v),
              type: addImportSourceForProtoIfNeeded(
                program,
                addType(v.type, model),
                model,
                v.type as NamespaceTraversable /*TODO: seems weird*/
              ),
              repeated: false,
            })
          ),
      };

      return oneof;
    }
    // TODO: all fields must have an index.
    // TODO: validate that the type is OK _before_ calling addImportSourceForProtoIfNeeded

    const fieldIndex = program.stateMap(state.fieldIndex).get(property) as number | undefined;
    const fieldIndexNode = property.decorators.find((d) => d.decorator === $field)?.args[0].node;
    if (!fieldIndexNode) throw new Error("Failed to recover field decorator argument.");

    if (fieldIndex === undefined) {
      reportDiagnostic(program, {
        code: "field-index",
        messageId: "missing",
        format: {
          name: property.name,
        },
        target: property,
      });
    }

    const reservations = program.stateMap(state.reserve).get(model) as Reservation[] | undefined;

    if (reservations) {
      for (const reservation of reservations) {
        if (typeof reservation === "string" && reservation === property.name) {
          reportDiagnostic(program, {
            code: "field-name",
            messageId: "user-reserved",
            format: {
              name: property.name,
            },
            target: getPropertyNameSyntaxTarget(property),
          });
        } else if (
          fieldIndex !== undefined &&
          typeof reservation === "number" &&
          reservation === fieldIndex
        ) {
          reportDiagnostic(program, {
            code: "field-index",
            messageId: "user-reserved",
            format: {
              index: fieldIndex.toString(),
            },
            target: fieldIndexNode,
          });
        } else if (
          fieldIndex !== undefined &&
          Array.isArray(reservation) &&
          fieldIndex >= reservation[0] &&
          fieldIndex <= reservation[1]
        ) {
          reportDiagnostic(program, {
            code: "field-index",
            messageId: "user-reserved-range",
            format: {
              index: fieldIndex.toString(),
            },
            target: fieldIndexNode,
          });
        }
      }
    }

    const field: ProtoFieldDeclaration = {
      kind: "field",
      name: property.name,
      type: addImportSourceForProtoIfNeeded(
        program,
        addType(property.type, model),
        model,
        property.type as NamespaceTraversable
      ),
      index: program.stateMap(state.fieldIndex).get(property),
    };

    // Determine if the property type is an array
    if (isArray(property.type)) field.repeated = true;

    return field;
  }

  /**
   * @param e - the Enum to convert
   * @returns a corresponding protobuf enum declaration
   *
   * INVARIANT: the enum's members must be integer values
   */
  function toEnum(e: Enum): ProtoEnumDeclaration {
    const needsAlias = new Set([...e.members.values()].map((v) => v.value)).size !== e.members.size;

    return {
      kind: "enum",
      name: e.name,
      allowAlias: needsAlias,
      variants: [...e.members.values()].map(({ name, value }) => [name, value as number]),
    };
  }

  type NamespaceTraversable = Enum | Model | Interface | Union | Operation | Namespace;

  function getPackageOfType(
    program: Program,
    t: NamespaceTraversable,
    quiet: boolean = false
  ): Namespace | null {
    /* c8 ignore start */

    // Most of this should be unreachable, but we'll guard it with diagnostics anyway in case of eventual synthetic types.

    switch (t.kind) {
      case "Enum":
      case "Model":
      case "Union":
      case "Interface":
        if (!t.namespace) {
          !quiet && reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, t.namespace);
        }
      case "Operation": {
        const logicalParent = t.interface ?? t.namespace;
        if (!logicalParent) {
          !quiet && reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, logicalParent);
        }
      }
      case "Namespace":
        if (packages.has(t)) return t;

        if (!t.namespace) {
          !quiet && reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, t.namespace);
        }
    }
    /* c8 ignore stop */
  }

  function addImportSourceForProtoIfNeeded<T extends ProtoType>(
    program: Program,
    pt: T,
    dependent: Model | Operation,
    dependency: NamespaceTraversable
  ): T {
    {
      // Early escape for externs
      let effectiveModel: Model | undefined;
      if (
        program.stateMap(state.externRef).has(dependency) ||
        (dependency.kind === "Model" &&
          (effectiveModel = effectiveModelCache.get(dependency)) &&
          program.stateMap(state.externRef).has(effectiveModel))
      ) {
        return pt;
      }
    }

    if (isArray(dependency)) {
      return addImportSourceForProtoIfNeeded(
        program,
        pt,
        dependent,
        (dependency as Model).templateArguments![0] as NamespaceTraversable
      );
    }
    try {
      // If we had an error producing an "unreachable" type, we would actually reach it during validation below, so the
      // try/catch allows us to pass the unreachable back up the chain.
      return matchType(pt, {
        map(k, v) {
          const mapInfo = mapImportSourceInformation.get(pt as ProtoMap);
          return mapInfo !== undefined
            ? (map(
                k,
                addImportSourceForProtoIfNeeded(program, v, mapInfo[0], mapInfo[1]) as
                  | ProtoRef
                  | ProtoScalar
                // Anything else is unreachable by construction.
              ) as T)
            : pt;
        },
        scalar() {
          return pt;
        },
        ref(r) {
          const [dependentPackage, dependencyPackage] = [
            getPackageOfType(program, dependent, true),
            getPackageOfType(program, dependency, true),
          ];

          if (
            dependentPackage === null ||
            dependencyPackage === null ||
            dependentPackage === dependencyPackage
          )
            return pt;

          const dependencyDetails = program.stateMap(state.package).get(dependencyPackage) as
            | Model
            | undefined;

          const dependencyPackageName = (
            dependencyDetails?.properties.get("name")?.type as StringLiteral | undefined
          )?.value;

          const dependencyPackagePrefix =
            dependencyPackageName === undefined || dependencyPackageName === ""
              ? ""
              : dependencyPackageName + ".";

          const dependencyFileName =
            (dependencyPackageName?.split(".") ?? ["main"]).join("/") + ".proto";

          importMap.get(dependentPackage)?.add(dependencyFileName);

          return ref(dependencyPackagePrefix + r) as T;
        },
      });
    } catch {
      return pt;
    }
  }
}

function isArray(t: Type) {
  return t.kind === "Model" && t.name === "Array" && t.namespace?.name === "TypeSpec";
}

/**
 * Simple utility function to capitalize a string.
 */
function capitalize<S extends string>(s: S) {
  return (s.slice(0, 1).toUpperCase() + s.slice(1)) as Capitalize<S>;
}

/**
 * Helps us squiggle the right things for operation return types.
 */
function getOperationReturnSyntaxTarget(op: Operation): DiagnosticTarget {
  const signature = op.node.signature;
  switch (signature.kind) {
    case SyntaxKind.OperationSignatureDeclaration:
      return signature.returnType;
    case SyntaxKind.OperationSignatureReference:
      // op foo is whatever;
      return op;
    default:
      const __exhaust: never = signature;
      throw new Error(
        `Internal Emitter Error: reached unreachable operation signature: ${op.node.signature.kind}`
      );
  }
}

function getMemberTypeSyntaxTarget(property: ModelProperty | EnumMember): DiagnosticTarget {
  const node = property.node;

  switch (node.kind) {
    case SyntaxKind.ModelProperty:
      return node.value;
    case SyntaxKind.ModelSpreadProperty:
      return node;
    case SyntaxKind.EnumMember:
      return node.value ?? node;
    case SyntaxKind.ProjectionModelProperty:
    case SyntaxKind.ProjectionModelSpreadProperty:
      return property;
    default:
      const __exhaust: never = node;
      throw new Error(
        `Internal Emitter Error: reached unreachable member node: ${property.node.kind}`
      );
  }
}

function getPropertyNameSyntaxTarget(property: ModelProperty): DiagnosticTarget {
  const node = property.node;

  switch (node.kind) {
    case SyntaxKind.ModelProperty:
      return node.id;
    case SyntaxKind.ModelSpreadProperty:
      return node;
    case SyntaxKind.ProjectionModelProperty:
    case SyntaxKind.ProjectionModelSpreadProperty:
      return property;
    default:
      const __exhaust: never = node;
      throw new Error(
        `Internal Emitter Error: reached unreachable model property node: ${property.node.kind}`
      );
  }
}
