// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type {
  DiagnosticTarget,
  Enum,
  EnumMember,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  StringLiteral,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import {
  compilerAssert,
  formatDiagnostic,
  getDoc,
  getEffectiveModelType,
  getFriendlyName,
  getTypeName,
  isArrayModelType,
  isDeclaredInNamespace,
  isRecordModelType,
  isTemplateInstance,
  isType,
  resolvePath,
} from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";
import { capitalize } from "@typespec/compiler/casing";
import { constantCase } from "change-case";
import type {
  ProtoEnumDeclaration,
  ProtoEnumVariantDeclaration,
  ProtoFieldDeclaration,
  ProtoFile,
  ProtoMap,
  ProtoMessageBodyDeclaration,
  ProtoMessageDeclaration,
  ProtoMethodDeclaration,
  ProtoOneOfDeclaration,
  ProtoOption,
  ProtoRef,
  ProtoScalar,
  ProtoTopLevelDeclaration,
  ProtoType,
  ScalarIntegralName,
} from "../ast.js";
import { map, matchType, ref, scalar, StreamingMode, unreachable } from "../ast.js";
import type { ProtobufEmitterOptions } from "../lib.js";
import { reportDiagnostic, state } from "../lib.js";
import type { LongRunningInfo, Reservation } from "../proto.js";
import { $field, isMap, PROTO_IDENT } from "../proto.js";
import { writeProtoFile } from "../write.js";

// Cache for scalar -> ProtoScalar map
const _protoScalarsMap = new WeakMap<Program, Map<Type, ProtoScalar>>();
const _protoExternMap = new WeakMap<Program, Map<string, [string, ProtoRef]>>();

/**
 * The name of the `oneof` declared within the wrapper message of a union used as a numbered field.
 */
const WRAPPER_ONEOF_NAME = "value";

/**
 * Create a worker function that converts the TypeSpec program to Protobuf and writes it to the file system.
 */
export function createProtobufEmitter(
  program: Program,
): (outDir: string, options: ProtobufEmitterOptions) => Promise<void> {
  return async function doEmit(outDir, options) {
    // Convert the program to a set of proto files.
    const files = tspToProto(program, options);

    if (!program.compilerOptions.dryRun && !options?.noEmit && !program.hasError()) {
      for (const file of files) {
        // If the file has a package, emit it to a path that is shaped like the package name. Otherwise emit to
        // main.proto

        // Collisions have already been detected.

        const packageSlug = file.package?.split(".") ?? ["main"];
        const filePath = resolvePath(outDir, ...packageSlug.slice(0, -1));

        await program.host.mkdirp(filePath);
        await program.host.writeFile(
          resolvePath(filePath, packageSlug[packageSlug.length - 1] + ".proto"),
          writeProtoFile(file),
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
function tspToProto(program: Program, emitterOptions: ProtobufEmitterOptions): ProtoFile[] {
  const packages = new Set<Namespace>(
    program.stateMap(state.package).keys() as Iterable<Namespace>,
  );

  const serviceInterfaces = [...(program.stateSet(state.service) as Set<Interface>)];

  const declaredMessages = [...program.stateSet(state.message)].filter(
    (t): t is Model => t.kind === "Model",
  );

  // Named unions explicitly marked with `@message` are eagerly emitted as wrapper messages.
  const declaredUnions = [...program.stateSet(state.message)].filter(
    (t): t is Union => t.kind === "Union" && !t.expression,
  );

  const declarationMap = new Map<Namespace, ProtoTopLevelDeclaration[]>(
    [...packages].map((p) => [p, []]),
  );

  const enumMemberSources = new WeakMap<ProtoEnumVariantDeclaration, EnumMember>();

  const visitedTypes = new Set<Type>();

  const validatedUnions = new Set<Union>();

  /**
   * Visits a model type, converting it into a message definition and adding it if it has not already been visited.
   * @param model - the model type to consider
   */
  function visitModel(model: Model, source: Type) {
    const modelPackage = getPackageOfType(program, model);
    const declarations = modelPackage && declarationMap.get(modelPackage);

    if (!declarations) {
      reportDiagnostic(program, {
        target: source,
        code: "model-not-in-package",
        format: { name: model.name },
      });
    }

    if (!visitedTypes.has(model)) {
      visitedTypes.add(model);
      declarations?.push(toMessage(model));
    }
  }

  /**
   * Visits a named union referenced by a numbered field, converting it into a wrapper message that contains a `oneof`
   * and adding it if it has not already been visited.
   */
  function visitUnion(union: Union, source: Type) {
    const unionPackage = getPackageOfType(program, union);
    const declarations = unionPackage && declarationMap.get(unionPackage);

    if (!declarations) {
      reportDiagnostic(program, {
        target: source,
        code: "model-not-in-package",
        messageId: "union",
        format: { name: union.name! },
      });
    }

    if (!visitedTypes.has(union)) {
      visitedTypes.add(union);
      declarations?.push(toWrapperMessage(union));
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
          ({ value: v }) => v === undefined || typeof v !== "number" || !Number.isInteger(v),
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
          target: members[0],
          code: "unconvertible-enum",
          messageId: "no-zero-first",
        });
      }

      declarations?.push(toEnum(e));
    }
  }

  const importMap = new Map([...packages].map((ns) => [ns, new Set<string>()]));

  function typeWantsImport(program: Program, t: RelativeSource, path: string) {
    const packageNs = getPackageOfType(program, t);

    if (packageNs) {
      importMap.get(packageNs)?.add(path);
    }
  }

  const mapImportSourceInformation = new WeakMap<
    ProtoMap,
    [RelativeSource, NamespaceTraversable]
  >();

  const effectiveModelCache = new Map<Model, Model | undefined>();

  for (const packageNs of packages) {
    addDeclarationsOfPackage(packageNs);
  }

  // `addDeclarationsOfPackage` only visits `@message` unions inside a package, so report the rest here.
  for (const union of declaredUnions) {
    if (!getPackageOfType(program, union)) {
      visitUnion(union, union);
    }
  }

  // Emit a file per package.
  const files = [...packages].map((namespace) => {
    const details = program.stateMap(state.package).get(namespace) as Model | undefined;
    const packageOptionsRaw = details?.properties.get("options")?.type as Model | undefined;

    const packageOptions = [...(packageOptionsRaw?.properties.entries() ?? [])]
      .map(([k, { type }]) => {
        // This condition is enforced by the definition of `dec package`
        if (type.kind === "Boolean" || type.kind === "String" || type.kind === "Number") {
          return [k, type.value] as [string, unknown];
        } else throw new Error(`Unexpected option type ${type.kind}`);
      })
      .filter((v) => !!v) as [string, unknown][];

    return {
      package: (
        (details?.properties.get("name") as ModelProperty | undefined)?.type as
          StringLiteral | undefined
      )?.value,

      options: Object.fromEntries(packageOptions),

      imports: [...(importMap.get(namespace) ?? [])],

      declarations: declarationMap.get(namespace),
      source: namespace,

      doc: getDoc(program, namespace),
    } as ProtoFile;
  });

  checkForNamespaceCollisions(files);

  if (emitterOptions["enum-value-prefix"] === "enum-name") {
    for (const file of files) {
      checkForEnumValueNameCollisions(file);
    }
  }

  return files;

  /**
   * Recursively searches a namespace for declarations that should be reified as Protobuf.
   *
   * @param namespace - the namespace to analyze
   * @returns an array of declarations
   */
  function addDeclarationsOfPackage(namespace: Namespace) {
    const eagerModels = new Set([
      ...declaredMessages.filter((m) => isDeclaredInNamespace(m, namespace)),
    ]);

    if (!emitterOptions["omit-unreachable-types"]) {
      // Add all models in the namespace that have `@field` on every property.
      for (const model of namespace.models.values()) {
        if (
          [...model.properties.values()].every(isFieldAnnotated) ||
          program.stateSet(state.message).has(model)
        ) {
          eagerModels.add(model);
        }
      }
    }

    for (const model of eagerModels) {
      if (
        // Don't eagerly visit externs
        !program.stateMap(state.externRef).has(model) &&
        // Only eagerly visit models where every field has a field index annotation.
        ([...model.properties.values()].every(isFieldAnnotated) ||
          // OR where the model has been explicitly marked as a message.
          program.stateSet(state.message).has(model))
      ) {
        visitModel(model, model);
      }
    }

    for (const union of declaredUnions) {
      if (
        union.namespace &&
        (union.namespace === namespace || isDeclaredInNamespace(union.namespace, namespace))
      ) {
        visitUnion(union, union);
      }
    }

    const interfacesInNamespace = new Set(
      serviceInterfaces.filter((iface) => isDeclaredInNamespace(iface, namespace)),
    );

    // Each interface will be reified as a `service` declaration.
    const declarations = declarationMap.get(namespace)!;
    for (const iface of interfacesInNamespace) {
      declarations.push({
        kind: "service",
        name: iface.name,
        // The service's methods are just projections of the interface operations.
        operations: [...iface.operations.values()].map(toMethodFromOperation),
        doc: getDoc(program, iface),
      });
    }
  }

  // #region inline helpers

  /**
   * Determines whether a property is fully annotated with field indices: either the property has `@field`, or it is an
   * unnumbered property of a named union type (an inline `oneof`) where every variant has `@field`.
   */
  function isFieldAnnotated(property: ModelProperty): boolean {
    const fieldIndices = program.stateMap(state.fieldIndex);
    if (fieldIndices.has(property)) return true;

    const type = property.type;
    return (
      type.kind === "Union" &&
      !type.expression &&
      type.variants.size > 0 &&
      [...type.variants.values()].every((variant) => fieldIndices.has(variant))
    );
  }

  /**
   * @param operation - the operation to convert
   * @returns a corresponding method declaration
   */
  function toMethodFromOperation(operation: Operation): ProtoMethodDeclaration {
    const streamingMode = program.stateMap(state.stream).get(operation) ?? StreamingMode.None;

    const isEmptyParams =
      operation.parameters.name === "" && operation.parameters.properties.size === 0;

    const input = isEmptyParams
      ? getCachedExternType(program, operation, "TypeSpec.Protobuf.WellKnown.Empty")
      : addImportSourceForProtoIfNeeded(
          program,
          addInputParams(operation.parameters, operation),
          operation,
          getEffectiveModelType(program, operation.parameters),
        );

    return {
      kind: "method",
      stream: streamingMode,
      name: capitalize(operation.name),
      input,
      returns: addImportSourceForProtoIfNeeded(
        program,
        addReturnType(operation.returnType, operation),
        operation,
        operation.returnType as NamespaceTraversable,
      ),
      options: toMethodOptions(operation),
      doc: getDoc(program, operation),
    };
  }

  /**
   * Converts the `LongRunningOperation` type an operation returns, if any, to the `google.longrunning.operation_info` method
   * option.
   *
   * @param operation - the operation to convert
   * @returns the method's options
   */
  function toMethodOptions(operation: Operation): ProtoOption[] {
    const info = program.stateMap(state.longRunning).get(operation.returnType) as
      LongRunningInfo | undefined;
    if (!info) return [];

    const [responseType, metadataType] = [
      toLongRunningTypeName(operation, info.responseType, 0, "response"),
      toLongRunningTypeName(operation, info.metadataType, 1, "metadata"),
    ];
    if (responseType === undefined || metadataType === undefined) return [];

    return [
      {
        name: "(google.longrunning.operation_info)",
        value: { response_type: responseType, metadata_type: metadataType },
      },
    ];
  }

  /**
   * Adds the response or metadata type of a long-running operation like any other type the operation refers to, and
   * returns its name relative to the operation's package.
   *
   * @param operation - the long-running operation
   * @param t - the response or metadata type
   * @param index - the index of `t` among the template arguments of `LongRunningOperation`
   * @param role - `response` or `metadata`, for diagnostics
   * @returns the type's name, or `undefined` if it cannot be emitted as a message
   */
  function toLongRunningTypeName(
    operation: Operation,
    t: Model,
    index: number,
    role: "response" | "metadata",
  ): string | undefined {
    if (t.name === "" || isArrayModelType(t) || isRecordModelType(t) || isMap(program, t)) {
      reportDiagnostic(program, {
        code: "long-running-type",
        format: { role },
        target: getLongRunningArgumentTarget(operation, t, index, role),
      });
      return undefined;
    }

    const type = addImportSourceForProtoIfNeeded(program, addType(t, operation), operation, t);

    return matchType(type, {
      ref: (r) => r,
      /* c8 ignore next 2 */
      scalar: () => undefined,
      map: () => undefined,
    });
  }

  /**
   * Gets the syntactic target of the response or metadata type of the `LongRunningOperation` an operation returns: the template
   * argument written in the return type whose type is `t`, preferring the one in the parameter's own position or named
   * after it, or else the whole return type, such as when the return type is an alias that wraps `LongRunningOperation`.
   *
   * @param operation - the long-running operation
   * @param t - the response or metadata type
   * @param index - the position of `t`'s parameter in `LongRunningOperation`
   * @param role - `response` or `metadata`, the parameter's name in lower case
   */
  function getLongRunningArgumentTarget(
    operation: Operation,
    t: Model,
    index: number,
    role: "response" | "metadata",
  ): DiagnosticTarget {
    const target = getOperationReturnSyntaxTarget(operation);
    if (!("kind" in target) || target.kind !== SyntaxKind.TypeReference) return target;

    const matches = target.arguments.filter(
      (arg) => program.checker.getTypeForNode(arg.argument) === t,
    );
    return (
      matches.find((arg) => arg.name?.sv.toLowerCase() === role) ??
      matches.find((arg) => !arg.name && target.arguments.indexOf(arg) === index) ??
      matches[0] ??
      target
    );
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
      capitalize(operation.name) + "Request",
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

    return checkExtern(effectiveModel, operation);
  }

  /**
   * Returns an extern ref if the given type is an instance of `Extern`, otherwise returns a ref to the model's name.
   */
  function checkExtern(model: Model, relativeSource: Model | Operation): ProtoRef {
    const extern = program.stateMap(state.externRef).get(model) as [string, string] | undefined;
    if (extern) {
      typeWantsImport(program, relativeSource, extern[0]);
      return ref(extern[1]);
    }

    return ref(getMessageName(model));
  }

  /**
   * Gets a cached intrinsic type. This will also attach desired imports to the relative reference source.
   */
  function getCachedExternType(
    program: Program,
    relativeSource: RelativeSource,
    name: string,
  ): ProtoRef {
    let cache = _protoExternMap.get(program);

    if (!cache) {
      cache = new Map();
      _protoExternMap.set(program, cache);
    }

    const cachedRef = cache.get(name);

    if (cachedRef) {
      const [source, ref] = cachedRef;
      typeWantsImport(program, relativeSource, source);
      return ref;
    }

    const [emptyType, diagnostics] = program.resolveTypeReference(name);

    if (!emptyType) {
      throw new Error(
        `Could not resolve the empty type: ${diagnostics.map((x) => formatDiagnostic(x)).join("\n")}`,
      );
    }

    const extern = program.stateMap(state.externRef).get(emptyType) as [string, string] | undefined;

    if (!extern) {
      throw new Error(`Unexpected: '${name}' was resolved but is not an extern type.`);
    }

    const [source, protoName] = extern;
    typeWantsImport(program, relativeSource, source);
    const result = ref(protoName);

    cache.set(name, [source, result]);

    return result;
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
        return addIntrinsicType(t, operation);
      /* eslint-ignore-next-line no-fallthrough */
      default:
        reportDiagnostic(program, {
          code: "unsupported-return-type",
          target: getOperationReturnSyntaxTarget(operation),
        });

        return unreachable("unsupported return type");
    }
  }

  /**
   * Adds an intrinsic type. Intrinsics are assumed to map to Extern types, so this will add the appropriate import.
   *
   * @param t - the intrinsic type to add
   * @param relativeSource - the relative source of the type
   * @returns a reference to the type's message
   */
  function addIntrinsicType(t: IntrinsicType, relativeSource: RelativeSource): ProtoRef {
    switch (t.name) {
      case "unknown":
        return getCachedExternType(program, relativeSource, "TypeSpec.Protobuf.WellKnown.Any");
      case "void": {
        return getCachedExternType(program, relativeSource, "TypeSpec.Protobuf.WellKnown.Empty");
      }
    }

    reportDiagnostic(program, {
      code: "unsupported-intrinsic",
      format: { name: t.name },
      target: t,
    });

    return unreachable("unsupported intrinsic type");
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
      return ref(getMessageName(effectiveModel));
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
  function addType(t: Type, relativeSource: RelativeSource): ProtoType {
    // Exit early if this type is an extern.
    const extern = program.stateMap(state.externRef).get(t) as [string, string] | undefined;
    if (extern) {
      typeWantsImport(program, relativeSource, extern[0]);
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

    switch (t.kind) {
      case "Model":
        // If we came from another model and this model is anonymous, then we can't reference it by name.
        if (t.name === "" && relativeSource.kind !== "Operation") {
          reportDiagnostic(program, {
            code: "anonymous-model",
            target: t,
          });
          return unreachable("anonymous model");
        }

        visitModel(t, relativeSource);

        return ref(getMessageName(t));
      case "Union":
        // A named union in a numbered field is emitted as a wrapper message containing a `oneof`.
        if (t.expression || !t.name) {
          reportDiagnostic(program, {
            code: "unsupported-field-type",
            messageId: "union",
            target: t,
          });
          return unreachable("anonymous union");
        }

        visitUnion(t, relativeSource);

        return ref(getMessageName(t));
      case "Enum":
        visitEnum(t);
        return ref(t.name);
      case "Scalar":
        return scalarToProto(t);
      case "Intrinsic":
        return addIntrinsicType(t, relativeSource);
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

  function mapToProto(t: Model, relativeSource: RelativeSource): ProtoMap {
    const [keyType, valueType] = t.templateMapper!.args;

    compilerAssert(isType(keyType), "Cannot be a value type");
    compilerAssert(isType(valueType), "Cannot be a value type");
    // A map's value cannot be another map.
    if (isMap(program, keyType)) {
      reportDiagnostic(program, {
        code: "unsupported-field-type",
        messageId: "recursive-map",
        target: valueType,
      });
      return unreachable("recursive map");
    }

    // This is a core compile error.
    if (!keyType || !valueType) return unreachable("nonexistent map key or value type");

    // Key constraint (integral | string) is enforced by the type constraint on the `Map<>` type.
    const keyProto = addType(keyType, relativeSource);
    const valueProto = addType(valueType, relativeSource) as ProtoRef | ProtoScalar;

    return map(
      keyProto[1] as "string" | ScalarIntegralName,
      valueType.kind === "Model" || valueType.kind === "Union"
        ? addImportSourceForProtoIfNeeded(program, valueProto, relativeSource, valueType)
        : valueProto,
    );
  }

  function arrayToProto(t: Model, relativeSource: RelativeSource): ProtoType {
    const valueType = (t as Model).templateMapper!.args[0];
    compilerAssert(isType(valueType), "Cannot be a value type");

    // Nested arrays are not supported.
    if (isArray(valueType)) {
      reportDiagnostic(program, {
        code: "nested-array",
        target: t,
      });
      return ref("<unreachable>");
    }

    return addType(valueType, relativeSource);
  }

  function getProtoScalarsMap(program: Program): Map<Type, ProtoScalar> {
    // The type references are different object identities in different programs, so we need to cache the map per program.
    // This really only affects tests in our current use case, but someone could be using the compiler API to compile
    // multiple programs and it also affects that.
    let scalarMap;
    if (_protoScalarsMap.has(program)) {
      scalarMap = _protoScalarsMap.get(program)!;
    } else {
      const entries = [
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
      ] as const;

      for (const [[type, diagnostics]] of entries) {
        if (!type) {
          const diagnosticString = diagnostics.map((x) => formatDiagnostic(x)).join("\n");
          throw new Error(
            `Failed to construct TypeSpec -> Protobuf scalar map. Unexpected failure to resolve TypeSpec scalar: ${diagnosticString}`,
          );
        }
      }

      scalarMap = new Map<Type, ProtoScalar>(entries.map(([[type], scalar]) => [type!, scalar]));

      _protoScalarsMap.set(program, scalarMap);
    }
    // Lazy initialize this map of known proto scalars.

    return scalarMap;
  }

  function scalarToProto(t: Scalar): ProtoType {
    const fullName = getTypeName(t);

    const protoType = getProtoScalarsMap(program).get(t);

    if (!protoType) {
      if (t.baseScalar) {
        return scalarToProto(t.baseScalar);
      } else {
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
      visitModel(effectiveModel, model);
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
            name: file.package ? `"${file.package}"` : "<empty>",
          },
          target: file.source,
        });
      }

      namespaces.add(file.package);
    }
  }

  function checkForEnumValueNameCollisions(file: ProtoFile) {
    const declarations = [...file.declarations];
    const names = new Map<
      string,
      { kind: ProtoTopLevelDeclaration["kind"] | "enum value"; owner: string }
    >();

    for (const declaration of declarations) {
      if (!names.has(declaration.name)) {
        names.set(declaration.name, { kind: declaration.kind, owner: declaration.name });
      }
    }

    for (const declaration of declarations) {
      if (declaration.kind !== "enum") continue;

      for (const variant of declaration.variants) {
        const member = enumMemberSources.get(variant);
        compilerAssert(member, "Missing TypeSpec source for emitted enum value.");
        const existing = names.get(variant.name);
        if (existing) {
          reportDiagnostic(program, {
            target: member,
            code: "enum-value-name-collision",
            format: { name: variant.name, kind: existing.kind, owner: existing.owner },
          });
        } else {
          names.set(variant.name, { kind: "enum value", owner: getTypeName(member) });
        }
      }
    }
  }

  /**
   * @param model - the Model to convert
   * @returns a corresponding message declaration
   */
  function toMessage(model: Model): ProtoMessageDeclaration {
    const reservations = program.stateMap(state.reserve).get(model) as Reservation[] | undefined;
    const scope = createFieldScope(reservations);
    return {
      kind: "message",
      name: getMessageName(model),
      reservations,
      declarations: [...model.properties.values()].map((f) =>
        toMessageBodyDeclaration(f, model, scope),
      ),
      doc: getDoc(program, model),
    };
  }

  /**
   * @param union - the named Union to convert
   * @returns a wrapper message declaration containing a `oneof value` whose members use the wrapper message's own
   *   field index space
   */
  function toWrapperMessage(union: Union): ProtoMessageDeclaration {
    const reservations = program.stateMap(state.reserve).get(union) as Reservation[] | undefined;
    const scope = createFieldScope(reservations);
    scope.declareOneOf(WRAPPER_ONEOF_NAME, union);

    return {
      kind: "message",
      name: getMessageName(union),
      reservations,
      declarations: [
        {
          kind: "oneof",
          name: WRAPPER_ONEOF_NAME,
          declarations: toOneOfFields(union, union, (name, index, variant) =>
            scope.declareField(name, index, variant, getFieldIndexNode(variant) ?? variant),
          ),
        },
      ],
      doc: getDoc(program, union),
    };
  }

  /**
   * Tracks the field names and indices declared in a single message so that collisions can be detected.
   */
  interface FieldScope {
    /**
     * Declares a field (including a `oneof` member), checking it against reservations and previously declared fields.
     */
    declareField(
      name: string,
      index: number | undefined,
      nameTarget: DiagnosticTarget,
      indexTarget: DiagnosticTarget,
    ): void;
    /**
     * Declares the name of a `oneof`, which shares the field name scope of its containing message.
     */
    declareOneOf(name: string, target: DiagnosticTarget): void;
  }

  function createFieldScope(reservations: readonly Reservation[] = []): FieldScope {
    const names = new Set<string>();
    const indices = new Map<number, string>();

    function declareName(name: string, target: DiagnosticTarget) {
      if (names.has(name)) {
        reportDiagnostic(program, {
          code: "field-name",
          messageId: "duplicate",
          format: { name },
          target,
        });
      } else {
        names.add(name);
      }
    }

    return {
      declareOneOf: declareName,
      declareField(name, index, nameTarget, indexTarget) {
        for (const reservation of reservations) {
          if (typeof reservation === "string" && reservation === name) {
            reportDiagnostic(program, {
              code: "field-name",
              messageId: "user-reserved",
              format: {
                name,
              },
              target: nameTarget,
            });
          } else if (
            index !== undefined &&
            typeof reservation === "number" &&
            reservation === index
          ) {
            reportDiagnostic(program, {
              code: "field-index",
              messageId: "user-reserved",
              format: {
                index: index.toString(),
              },
              target: indexTarget,
            });
          } else if (
            index !== undefined &&
            Array.isArray(reservation) &&
            index >= reservation[0] &&
            index <= reservation[1]
          ) {
            reportDiagnostic(program, {
              code: "field-index",
              messageId: "user-reserved-range",
              format: {
                index: index.toString(),
              },
              target: indexTarget,
            });
          }
        }

        declareName(name, nameTarget);

        if (index !== undefined) {
          const other = indices.get(index);
          if (other !== undefined) {
            reportDiagnostic(program, {
              code: "field-index",
              messageId: "duplicate",
              format: { name, index: index.toString(), other },
              target: indexTarget,
            });
          } else {
            indices.set(index, name);
          }
        }
      },
    };
  }

  function getMessageName(type: Model | Union): string {
    const friendlyName = getFriendlyName(program, type);

    if (friendlyName) return capitalize(friendlyName);

    const templateArguments = isTemplateInstance(type) ? type.templateMapper!.args : [];

    const prefix = templateArguments
      .map(function getTypePrefixName(arg, idx) {
        if ("name" in arg && typeof arg.name === "string" && arg.name !== "")
          return capitalize(arg.name!);
        else {
          reportDiagnostic.once(program, {
            code: "unspeakable-template-argument",
            // TODO-WILL - I'd rather attach the diagnostic to the template argument, but it's the best I can do for
            // now to attach it to the model itself.
            target: type,
            format: {
              name: type.name!,
            },
          });

          return `T${idx}`;
        }
      })
      .join("");

    return prefix + capitalize(type.name!);
  }

  /**
   * @param property - the ModelProperty to convert
   * @returns a corresponding declaration
   */
  function toMessageBodyDeclaration(
    property: ModelProperty,
    model: Model,
    scope: FieldScope,
  ): ProtoMessageBodyDeclaration {
    const fieldIndex = program.stateMap(state.fieldIndex).get(property) as number | undefined;
    const fieldIndexNode = getFieldIndexNode(property);

    // A union-typed property without `@field` is emitted inline as a `oneof`. With `@field`, the union is emitted as a
    // wrapper message by `addType`.
    if (
      property.type.kind === "Union" &&
      !property.decorators.some((d) => d.decorator === $field)
    ) {
      return toOneOf(property, property.type, model, scope);
    }

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

    if (fieldIndex && !fieldIndexNode)
      throw new Error("Failed to recover field decorator argument.");

    scope.declareField(
      property.name,
      fieldIndex,
      getPropertyNameSyntaxTarget(property),
      // Fail over to using the model if the field index node is missing... this should never occur but it's the
      // simplest way to satisfy the type system.
      fieldIndexNode ?? model,
    );

    const field: ProtoFieldDeclaration = {
      kind: "field",
      name: property.name,
      type: addImportSourceForProtoIfNeeded(
        program,
        addType(property.type, model),
        model,
        property.type as NamespaceTraversable,
      ),
      index: program.stateMap(state.fieldIndex).get(property),
      doc: getDoc(program, property),
    };

    // Determine if the property type is an array
    if (isArray(property.type)) field.repeated = true;
    field.optional = shouldEmitOptionalLabel(property);

    return field;
  }

  /**
   * Converts an unnumbered, union-typed property into an inline `oneof` whose members share the field index space of
   * the containing message.
   */
  function toOneOf(
    property: ModelProperty,
    union: Union,
    model: Model,
    scope: FieldScope,
  ): ProtoOneOfDeclaration {
    if (union.expression || !union.name) {
      // Each `oneof` member needs a name, so only named unions are supported.
      reportDiagnostic(program, {
        code: "unsupported-field-type",
        messageId: "union",
        target: property,
      });
      return unreachable("anonymous union");
    }

    if (!property.optional) {
      reportDiagnostic(program, {
        code: "invalid-oneof",
        messageId: "required",
        format: { name: property.name },
        target: property,
      });
    }

    if (!PROTO_IDENT.test(property.name)) {
      reportDiagnostic(program, {
        code: "invalid-oneof",
        messageId: "invalid-name",
        format: { name: property.name },
        target: getPropertyNameSyntaxTarget(property),
      });
    }

    scope.declareOneOf(property.name, getPropertyNameSyntaxTarget(property));

    return {
      kind: "oneof",
      name: property.name,
      // Collisions depend on the containing message (a union may be used by several), so they are reported on the
      // property rather than on the union variant.
      declarations: toOneOfFields(union, model, (name, index) =>
        scope.declareField(name, index, property, property),
      ),
      doc: getDoc(program, property) ?? getDoc(program, union),
    };
  }

  /**
   * Converts the variants of a named union into `oneof` member fields.
   *
   * @param union - the union to convert
   * @param relativeSource - the type that owns the resulting fields, used to resolve references and imports
   * @param declareField - registers each member with the field scope of the owning message
   */
  function toOneOfFields(
    union: Union,
    relativeSource: Model | Union,
    declareField: (name: string, index: number | undefined, variant: UnionVariant) => void,
  ): ProtoFieldDeclaration[] {
    // Problems with the union itself are reported once, even if it is converted for several messages.
    const report = !validatedUnions.has(union);
    validatedUnions.add(union);

    if (report && union.variants.size === 0) {
      reportDiagnostic(program, {
        code: "invalid-oneof",
        messageId: "empty",
        format: { name: union.name! },
        target: union,
      });
    }

    const fields: ProtoFieldDeclaration[] = [];

    for (const variant of union.variants.values()) {
      if (typeof variant.name !== "string") {
        if (report) {
          reportDiagnostic(program, {
            code: "invalid-oneof",
            messageId: "unnamed-variant",
            target: variant,
          });
        }
        continue;
      }

      const index = program.stateMap(state.fieldIndex).get(variant) as number | undefined;

      if (report && !PROTO_IDENT.test(variant.name)) {
        reportDiagnostic(program, {
          code: "invalid-oneof",
          messageId: "invalid-member-name",
          format: { name: variant.name },
          target: variant,
        });
      }

      if (report && index === undefined) {
        reportDiagnostic(program, {
          code: "field-index",
          messageId: "missing",
          format: { name: variant.name },
          target: variant,
        });
      }

      // `isArrayModelType` also matches named array models such as `model Strings is string[]`.
      const isArrayVariant = variant.type.kind === "Model" && isArrayModelType(variant.type);
      if (isArrayVariant || isMap(program, variant.type)) {
        if (report) {
          reportDiagnostic(program, {
            code: "invalid-oneof",
            messageId: isArrayVariant ? "repeated-variant" : "map-variant",
            format: { name: variant.name },
            target: variant,
          });
        }
        continue;
      }

      declareField(variant.name, index, variant);

      fields.push({
        kind: "field",
        name: variant.name,
        type: addImportSourceForProtoIfNeeded(
          program,
          addType(variant.type, relativeSource),
          relativeSource,
          variant.type as NamespaceTraversable,
        ),
        index: index!,
        doc: getDoc(program, variant),
      });
    }

    return fields;
  }

  function getFieldIndexNode(target: ModelProperty | UnionVariant) {
    return target.decorators.find((d) => d.decorator === $field)?.args[0].node;
  }

  function shouldEmitOptionalLabel(property: ModelProperty): boolean {
    if (!property.optional) {
      return false;
    }

    if (isArray(property.type)) {
      reportDiagnostic.once(program, {
        code: "optional-array-field",
        format: {},
        target: property,
      });
      return false;
    }

    if (isMap(program, property.type)) {
      reportDiagnostic.once(program, {
        code: "optional-map-field",
        format: {},
        target: property,
      });
      return false;
    }

    switch (property.type.kind) {
      case "Scalar":
      case "Enum":
        return true;
      case "Intrinsic":
      case "Model":
      case "Union":
        return false;
      default:
        return false;
    }
  }

  /**
   * @param e - the Enum to convert
   * @returns a corresponding protobuf enum declaration
   *
   * INVARIANT: the enum's members must be integer values
   */
  function toEnum(e: Enum): ProtoEnumDeclaration {
    const needsAlias = new Set([...e.members.values()].map((v) => v.value)).size !== e.members.size;
    const prefix =
      emitterOptions["enum-value-prefix"] === "enum-name"
        ? constantCase(e.name, { prefixCharacters: "_" }) + "_"
        : undefined;
    return {
      kind: "enum",
      name: e.name,
      allowAlias: needsAlias,
      variants: [...e.members.values()].map((variant): ProtoEnumVariantDeclaration => {
        let name = variant.name;
        if (prefix !== undefined) {
          if (!name.startsWith(prefix)) {
            name = constantCase(name, { prefixCharacters: "_" });
            if (!name.startsWith(prefix)) {
              name = prefix + name;
            }
          }
        }
        const declaration: ProtoEnumVariantDeclaration = {
          kind: "variant",
          name,
          value: variant.value as number,
          doc: getDoc(program, variant),
        };
        enumMemberSources.set(declaration, variant);
        return declaration;
      }),
      doc: getDoc(program, e),
    };
  }

  type NamespaceTraversable =
    Enum | Model | Interface | Union | Operation | Namespace | IntrinsicType;

  /**
   * A type that can refer to other types in Protobuf output.
   */
  type RelativeSource = Model | Operation | Union;

  function getPackageOfType(program: Program, t: NamespaceTraversable): Namespace | null {
    /* c8 ignore start */

    // Most of this should be unreachable, but we'll guard it with diagnostics anyway in case of eventual synthetic types.

    switch (t.kind) {
      case "Intrinsic":
        // Intrinsics are all handled explicitly.
        return null;
      case "Enum":
      case "Model":
      case "Union":
      case "Interface":
        if (!t.namespace) {
          return null;
        } else {
          return getPackageOfType(program, t.namespace);
        }
      case "Operation": {
        const logicalParent = t.interface ?? t.namespace;
        if (!logicalParent) {
          return null;
        } else {
          return getPackageOfType(program, logicalParent);
        }
      }
      case "Namespace":
        if (packages.has(t)) return t;

        if (!t.namespace) {
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
    dependent: RelativeSource,
    dependency: NamespaceTraversable,
  ): T {
    {
      // Early escape for intrinsics
      if (dependency.kind === "Intrinsic") {
        // Intrinsics and imports are handled explicitly by the emitter.
        return pt;
      }
    }

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
        (dependency as Model).templateMapper!.args[0] as NamespaceTraversable,
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
                  ProtoRef | ProtoScalar,
                // Anything else is unreachable by construction.
              ) as T)
            : pt;
        },
        scalar() {
          return pt;
        },
        ref(r) {
          const [dependentPackage, dependencyPackage] = [
            getPackageOfType(program, dependent),
            getPackageOfType(program, dependency),
          ];

          if (
            dependentPackage === null ||
            dependencyPackage === null ||
            dependentPackage === dependencyPackage
          )
            return pt;

          const dependencyDetails = program.stateMap(state.package).get(dependencyPackage) as
            Model | undefined;

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
 * Gets the syntactic return type target for an operation.
 *
 * Helps us squiggle the right things for operation return types.
 *
 * See https://github.com/microsoft/typespec/issues/1650. This issue tracks helpers for doing this without requiring
 * emitters to implement this functionality.
 */
function getOperationReturnSyntaxTarget(op: Operation): DiagnosticTarget {
  const signature = op.node!.signature;
  switch (signature.kind) {
    case SyntaxKind.OperationSignatureDeclaration:
      return signature.returnType;
    case SyntaxKind.OperationSignatureReference:
      return op;
    default:
      const __exhaust: never = signature;
      throw new Error(
        `Internal Emitter Error: reached unreachable operation signature: ${op.node?.signature.kind}`,
      );
  }
}

/**
 * Gets the syntactic position of a model property name.
 *
 * See https://github.com/microsoft/typespec/issues/1650. This issue tracks helpers for doing this without requiring
 * emitters to implement this functionality.
 */
function getPropertyNameSyntaxTarget(property: ModelProperty): DiagnosticTarget {
  const node = property.node;
  if (node === undefined) {
    return property;
  }
  switch (node.kind) {
    case SyntaxKind.ModelProperty:
    case SyntaxKind.ObjectLiteralProperty:
      return node.id;
    case SyntaxKind.ModelSpreadProperty:
      return node;
    default:
      const __exhaust: never = node;
      throw new Error(
        `Internal Emitter Error: reached unreachable model property node: ${property.node?.kind}`,
      );
  }
}
