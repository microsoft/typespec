import {
  getIntrinsicModelName,
  InterfaceType,
  isIntrinsic,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  Node,
  OperationType,
  Program,
  resolvePath,
  SyntaxKind,
  Type,
} from "@cadl-lang/compiler";
import { fieldIndexKey, packageKey, reportDiagnostic, serviceKey } from "./lib.js";
import {
  $map,
  map,
  ProtoFieldDeclaration,
  ProtoFile,
  ProtoMessageDeclaration,
  ProtoMethodDeclaration,
  ProtoRef,
  ProtoType,
  ref,
  scalar,
  ScalarIntegralName,
} from "./proto.js";
import { writeProtoFile } from "./write.js";

/**
 * Options that the gRPC emitter accepts.
 */
interface GrpcEmitterOptions {
  /**
   * The directory where the emitter will write the Protobuf output tree.
   */
  outDir: string;
}

// Default options
const DEFAULT_GRPC_EMITTER_OPTIONS: GrpcEmitterOptions = {
  // TODO: shouldn't this be configured by default?
  outDir: "./cadl-output/",
};

/**
 * Create a worker function that converts the CADL program to Protobuf and writes it to the file system.
 */
export function createGrpcEmitter(
  program: Program
): (emitterOptions?: Partial<GrpcEmitterOptions>) => Promise<void> {
  return async function doEmit(emitterOptions) {
    const options = {
      ...DEFAULT_GRPC_EMITTER_OPTIONS,
      ...emitterOptions,
    };

    const outDir = resolvePath(options.outDir);

    // Convert the program to a set of proto files.
    const files = cadlToProto(program);

    if (!program.compilerOptions.noEmit && !program.hasError()) {
      for (const file of files) {
        // If the file has a package, emit it to a path that is shaped like the package name. Otherwise emit to
        // main.proto
        // TODO: What do we do if there are multiple files without packages, or multiple files with the same package?
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
  const packages = program.stateMap(packageKey) as Map<NamespaceType, string>;

  // Emit a file per package.
  return [...packages].map(
    ([namespace, packageName]) =>
      ({
        package: packageName,
        options: {},
        declarations: declarationsFromNamespace(namespace),
      } as ProtoFile)
  );

  /**
   * Recursively searches a namespace for declarations that should be reified as Protobuf.
   *
   * @param namespace - the namespace to analyze
   * @returns an array of declarations
   */
  function declarationsFromNamespace(namespace: NamespaceType): ProtoFile["declarations"] {
    const serviceInterfaces = new Set<InterfaceType>();

    // This IIFE adds all interfaces decorated with `service` that are reachable from `namespace`
    (function recursiveAddInterfaces(namespace: NamespaceType) {
      for (const memberInterface of namespace.interfaces.values()) {
        if (program.stateSet(serviceKey).has(memberInterface)) {
          serviceInterfaces.add(memberInterface);
        }
      }

      for (const nested of namespace.namespaces.values()) {
        // !! We only want to recurse on namespaces that are not, themselves, packages.
        if (!packages.has(nested)) recursiveAddInterfaces(nested);
      }
    })(namespace);

    const declarations: ProtoFile["declarations"] = [];
    const visitedTypes = new Set<Node>();

    /**
     * Visits a model type, converting it into a message definition and adding it if it has not already been visited.
     * @param model - the model type to consider
     */
    function visitType(model: ModelType) {
      // TODO: when can the node be undefined?
      if (model.node && !visitedTypes.has(model.node)) {
        visitedTypes.add(model.node);
        declarations.push(toMessage(model));
      }
    }

    function visitSynthetic(model: SyntheticModel) {
      if (!visitedTypes.has(model.trueModelNode)) {
        visitedTypes.add(model.trueModelNode);
        declarations.push({
          kind: "message",
          name: model.name,
          declarations: model.properties.map(toField),
        });
      }
    }

    const effectiveModelTypeCache = new Map<ModelType, SyntheticModel | undefined>();

    // Each interface will be reified as a `service` declaration.
    for (const iface of serviceInterfaces) {
      declarations.push({
        kind: "service",
        name: iface.name,
        // The service's methods are just projections of the interface operations.
        operations: [...iface.operations.values()].map(toMethodFromOperation),
      });
    }

    return declarations;

    /**
     * @param operation - the operation to convert
     * @returns a corresponding method declaration
     */
    function toMethodFromOperation(operation: OperationType): ProtoMethodDeclaration {
      return {
        kind: "method",
        name: operation.name,
        input: addInputParams(operation.parameters, operation.name),
        returns: addReturnType(operation.returnType),
      };
    }

    /**
     * Checks a parameter Model satisfies the constraints for a gRPC method input and adds it to the declarations,
     * returning a ProtoRef to the generated named message.
     *
     * @param model - the model to add
     * @returns a reference to the model's message
     */
    function addInputParams(paramsModel: ModelType, operationName: string): ProtoRef {
      const messageLike = getEffectiveModelType(paramsModel, capitalize(operationName) + "Request");

      if (messageLike) {
        return ref(messageLike.name);
      }

      reportDiagnostic(program, {
        code: "unsupported-input-type",
        messageId: "unconvertible",
        target: paramsModel,
      });

      return ref("<unreachable>");
    }

    /**
     * Checks that a return type is a Model and converts it to a message, adding it to the declarations and returning
     * a reference to its name.
     *
     * @param t - the model to add
     * @returns a reference to the model's message
     */
    function addReturnType(t: Type): ProtoRef {
      /* TODO: need to support importing google/protobuf/empty.proto and others
         This is also very important for handling datetime values.

      if (t.kind === "Intrinsic" && t.name === "void") {
        return ref("google.protobuf.Empty");
      }
      */

      switch (t.kind) {
        case "Model":
          visitType(t);
          return ref(t.name);
        default:
          reportDiagnostic(program, {
            code: "unsupported-return-type",
            target: t,
          });
          return ref("<unreachable>");
      }
    }

    /**
     * Converts a CADL type to a Protobuf type, adding a corresponding message if necessary.
     *
     * @param t - the type to add to the ProtoFile.
     * @returns a Protobuf type corresponding to the given type
     */
    function addType(t: Type): ProtoType {
      // We will handle all intrinsics separately, including maps.
      if (isIntrinsic(program, t)) return intrinsicToProto(getIntrinsicModelName(program, t), t);

      // TODO: streams.

      switch (t.kind) {
        case "Model":
          visitType(t);
          return ref(t.name);
        case "Array":
          if (t.elementType.kind === "Model") {
            visitType(t.elementType);
            return ref(t.elementType.name);
          }
        // eslint-disable-next-line no-fallthrough
        default:
          reportDiagnostic(program, {
            code: "unsupported-field-type",
            messageId: "unconvertible",
            format: {
              type: t.kind,
            },
            target: t,
          });
          return ref("<unreachable>");
      }
    }

    function intrinsicToProto(name: string, t: Type): ProtoType {
      // Maps are considered intrinsics, so we check if the type is an instance of Cadl.Map
      if (t.kind === "Model" && t.name === "Map" && t.namespace?.name === "Cadl") {
        // Intrinsic map.
        const [keyType, valueType] = t.templateArguments ?? [];

        // This is a core compile error.
        if (!keyType || !valueType) return ref("<unreachable>");

        const keyProto = addType(keyType);
        const valueProto = addType(valueType);

        // A map's value cannot be another map.
        if (valueProto[0] === $map) {
          reportDiagnostic(program, {
            code: "unsupported-field-type",
            messageId: "recursive-map",
            target: valueType,
          });
          return ref("<unreachable>");
        }

        return map(keyProto[1] as "string" | ScalarIntegralName, valueProto);
      }

      // TODO: there are way more scalars in proto than this. How do we expose those knobs to the API writer?
      const protoType = {
        bytes: scalar("bytes"),
        boolean: scalar("bool"),
        int32: scalar("int32"),
        int64: scalar("int64"),
        uint32: scalar("uint32"),
        uint64: scalar("uint64"),
        string: scalar("string"),
        float32: scalar("float"),
        float64: scalar("double"),
      }[name];

      if (!protoType) {
        reportDiagnostic(program, {
          code: "unsupported-field-type",
          messageId: "unknown-intrinsic",
          format: {
            name: name,
          },
          target: t,
        });
        return ref("<unreachable>");
      }

      return protoType;
    }

    /**
     * @param model - the Model to convert
     * @returns a corresponding message declaration
     */
    function toMessage(model: ModelType): ProtoMessageDeclaration {
      return {
        kind: "message",
        name: model.name,
        declarations: [...model.properties.values()].map(toField),
      };
    }

    /**
     * @param property - the ModelProperty to convert
     * @returns a corresponding field declaration
     */
    function toField(property: ModelTypeProperty): ProtoFieldDeclaration {
      const field: ProtoFieldDeclaration = {
        kind: "field",
        name: property.name,
        type: addType(property.type),
        index: program.stateMap(fieldIndexKey).get(property),
      };

      if (property.type.kind === "Array") field.repeated = true;

      return field;
    }

    function getEffectiveModelType(
      model: ModelType,
      anonymousModelName?: string
    ): SyntheticModel | undefined {
      if (effectiveModelTypeCache.has(model)) return effectiveModelTypeCache.get(model);

      const properties = [...model.properties.values()];

      const source = properties[0]?.sourceProperty?.node.parent;

      if (
        source &&
        source.kind === SyntaxKind.ModelStatement &&
        properties.length > 0 &&
        properties.every((p) => p.sourceProperty?.node.parent === source)
      ) {
        // TODO: horrible hack: id.sv?
        const messageLike: SyntheticModel = {
          name: (source as any).id.sv,
          properties,
          trueModelNode: source,
        };

        effectiveModelTypeCache.set(model, messageLike);

        visitSynthetic(messageLike);
        return messageLike;
      } else if (model.node && model.name === "" && anonymousModelName) {
        const messageLike: SyntheticModel = {
          name: anonymousModelName,
          properties,
          trueModelNode: model.node,
        };

        effectiveModelTypeCache.set(model, messageLike);

        visitSynthetic(messageLike);
        return messageLike;
      }

      effectiveModelTypeCache.set(model, undefined);
      return undefined;
    }
  }
}

/**
 * A synthetic (created ad-hoc during transformation) model for conversion to a gRPC message.
 *
 * A synthetic model is named, whereas the underlying model may not be.
 */
interface SyntheticModel {
  /**
   * The message's model name.
   */
  name: string;

  /**
   * The property entries in the messag
   */
  properties: ModelTypeProperty[];

  /**
   * The AST Node that this model is tied to (used for deduplication).
   */
  trueModelNode: Node;
}

/**
 * Simple utility function to capitalize a string.
 */
function capitalize<S extends string>(s: S) {
  return (s.slice(0, 1).toUpperCase() + s.slice(1)) as Capitalize<S>;
}
