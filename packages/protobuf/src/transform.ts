// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Enum,
  getEffectiveModelType,
  getTypeName,
  Interface,
  isDeclaredInNamespace,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  resolvePath,
  Scalar,
  Type,
} from "@cadl-lang/compiler";
import {
  map,
  ProtoEnumDeclaration,
  ProtoFieldDeclaration,
  ProtoFile,
  ProtoMessageDeclaration,
  ProtoMethodDeclaration,
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
import { isMap } from "./proto.js";
import { writeProtoFile } from "./write.js";

// Default options
const DEFAULT_OPTIONS = {
  outputDirectory: "./cadl-output/",
} as const;

/**
 * Create a worker function that converts the CADL program to Protobuf and writes it to the file system.
 */
export function createProtobufEmitter(
  program: Program
): (options?: ProtobufEmitterOptions) => Promise<void> {
  return async function doEmit(options) {
    const outDir = resolvePath(options?.outputDirectory ?? DEFAULT_OPTIONS.outputDirectory);

    // Convert the program to a set of proto files.
    const files = cadlToProto(program);

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
 * Create a set of proto files that represent the CADL program.
 *
 * This is the meat of the emitter.
 */
function cadlToProto(program: Program): ProtoFile[] {
  const packages = new Set(listServices(program).map((service) => service.type));

  const serviceInterfaces = [...(program.stateSet(state.serviceInterface) as Set<Interface>)];

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
          target: members[0],
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

  const effectiveModelCache = new Map<Model, Model | undefined>();

  for (const packageNs of packages) {
    addDeclarationsOfPackage(packageNs);
  }

  // Emit a file per package.
  const files = [...packages].map(
    (namespace) =>
      ({
        package: program.stateMap(state.packageName).get(namespace),

        // TODO: The language guide is really unclear about how to handle these. We may also need a facility for
        // allowing packages to declare extensions.
        options: {},

        imports: [...(importMap.get(namespace) ?? [])],

        declarations: declarationMap.get(namespace),
        source: namespace,
      } as ProtoFile)
  );

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
    // TODO: add support for cross-package type references
    // https://github.com/microsoft/cadl/issues/632

    // TODO: until then, reject cross-package references

    const streamingMode = program.stateMap(state.stream).get(operation) ?? StreamingMode.None;

    return {
      kind: "method",
      stream: streamingMode,
      name: capitalize(operation.name),
      input: addInputParams(operation.parameters, operation),
      returns: addReturnType(operation.returnType, operation),
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

    // Not sure if this can or can't happen.
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
    // TODO: need to support importing google/protobuf/empty.proto and others
    // https://github.com/microsoft/cadl/issues/630

    // This is also very important for handling datetime values.

    // if (t.kind === "Intrinsic" && t.name === "void") {
    //  return ref("google.protobuf.Empty");
    // }

    switch (t.kind) {
      case "Model":
        return addReturnModel(t, operation);

      default:
        // TODO: logic is duplicated in addReturnModel
        reportDiagnostic(program, {
          code: "unsupported-return-type",
          target: t,
        });

        return unreachable("unsupported return type");
    }
  }

  /**
   * Converts a Cadl Model to a Protobuf Ref in return position, adding a corresponding message if necessary.
   *
   * @param m - the model to add to the Protofile.
   * @returns a Protobuf reference to the model
   */
  function addReturnModel(m: Model, operation: Operation): ProtoRef {
    // TODO: handle import
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
      target: m,
    });

    return unreachable("unsupported return type");
  }

  /**
   * Converts a CADL type to a Protobuf type, adding a corresponding message if necessary.
   *
   * @param t - the type to add to the ProtoFile.
   * @returns a Protobuf type corresponding to the given type
   */
  function addType(t: Type): ProtoType {
    // TODO: too much duplication with addReturnModel
    // TODO: handle import of extern
    const extern = program.stateMap(state.externRef).get(t) as [string, string] | undefined;
    if (extern) {
      return ref(extern[1]);
    }

    if (isMap(program, t)) {
      return mapToProto(t as Model);
    }

    // Arrays transform into repeated fields, so we'll silently replace `t` with the array's member if this is an array.
    // The `repeated` keyword will be added when the field is composed.
    if (isArray(t)) {
      return arrayToProto(t as Model);
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

  function mapToProto(t: Model): ProtoType {
    const [keyType, valueType] = t.templateArguments ?? [];

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

    const keyProto = addType(keyType);
    const valueProto = addType(valueType) as ProtoRef | ProtoScalar;

    return map(keyProto[1] as "string" | ScalarIntegralName, valueProto);
  }

  function arrayToProto(t: Model): ProtoType {
    const valueType = (t as Model).templateArguments![0];

    // Nested arrays are not supported.
    if (isArray(valueType)) {
      reportDiagnostic(program, {
        code: "nested-array",
        target: t,
      });
      return ref("<unreachable>");
    }

    return addType(valueType);
  }

  function scalarToProto(t: Scalar): ProtoType {
    const fullName = getTypeName(t);

    const protoType = {
      "Cadl.bytes": scalar("bytes"),
      "Cadl.boolean": scalar("bool"),
      "Cadl.string": scalar("string"),
      "Cadl.int32": scalar("int32"),
      "Cadl.int64": scalar("int64"),
      "Cadl.uint32": scalar("uint32"),
      "Cadl.uint64": scalar("uint64"),
      "Cadl.float32": scalar("float"),
      "Cadl.float64": scalar("double"),
      "Cadl.Protobuf.sfixed32": scalar("sfixed32"),
      "Cadl.Protobuf.sfixed64": scalar("sfixed64"),
      "Cadl.Protobuf.sint32": scalar("sint32"),
      "Cadl.Protobuf.sint64": scalar("sint64"),
      "Cadl.Protobuf.fixed32": scalar("fixed32"),
      "Cadl.Protobuf.fixed64": scalar("fixed64"),
    }[fullName];

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
      declarations: [...model.properties.values()].map(toField),
    };
  }

  /**
   * @param property - the ModelProperty to convert
   * @returns a corresponding field declaration
   */
  function toField(property: ModelProperty): ProtoFieldDeclaration {
    const field: ProtoFieldDeclaration = {
      kind: "field",
      name: property.name,
      type: addType(property.type),
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

  function getPackageOfType(
    program: Program,
    t: Model | Namespace | Operation | Interface | Enum
  ): Namespace | null {
    /* c8 ignore start */

    // Most of this should be unreachable, but we'll guard it with diagnostics anyway in case of eventual synthetic types.

    switch (t.kind) {
      case "Enum":
      case "Model":
      case "Interface":
        if (!t.namespace) {
          reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, t.namespace);
        }
      case "Operation": {
        const logicalParent = t.interface ?? t.namespace;
        if (!logicalParent) {
          reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, logicalParent);
        }
      }
      case "Namespace":
        if (packages.has(t)) return t;

        if (!t.namespace) {
          reportDiagnostic(program, { code: "no-package", target: t });
          return null;
        } else {
          return getPackageOfType(program, t.namespace);
        }
    }
    /* c8 ignore stop */
  }
}

function isArray(t: Type) {
  return t.kind === "Model" && t.name === "Array" && t.namespace?.name === "Cadl";
}

/**
 * Simple utility function to capitalize a string.
 */
function capitalize<S extends string>(s: S) {
  return (s.slice(0, 1).toUpperCase() + s.slice(1)) as Capitalize<S>;
}
