import { compilerAssert, emitFile, isTemplateDeclaration } from "../../core/index.js";
import { resolveDeclarationReferenceScope } from "../../emitter-framework/ref-scope.js";
import { TypeEmitterHook } from "./types.js";

export const DefaultCircularReferenceHandler: TypeEmitterHook<any, any>["circularReference"] = ({
  target,
  emitter,
  cycle,
  scope,
  context,
  reference,
}) => {
  if (!cycle.containsDeclaration) {
    throw new Error(
      `Circular references to non-declarations are not supported by this emitter. Cycle:\n${cycle}`
    );
  }
  if (target.kind !== "declaration") {
    return target;
  }
  compilerAssert(
    scope,
    "Emit context must have a scope set in order to create references to declarations."
  );
  const { pathUp, pathDown, commonScope } = resolveDeclarationReferenceScope(target, scope);
  return reference({ target, pathUp, pathDown, commonScope, emitter, context });
};

/**
 * Basic declaration name implementation that will use the type name and in the case of template instance append the template parameter names to the declaration name.
 * @returns
 */
export const BasicDeclarationName: TypeEmitterHook<any, any>["declarationName"] = ({
  type,
  emitter,
}): string | undefined => {
  compilerAssert(type.name !== undefined, "Can't emit a declaration that doesn't have a name.");

  if (type.kind === "Enum" || type.kind === "Intrinsic") {
    return type.name;
  }

  // for operations inside interfaces, we don't want to do the fancy thing because it will make
  // operations inside instantiated interfaces get weird names
  if (type.kind === "Operation" && type.interface) {
    return type.name;
  }

  if (!type.templateMapper) {
    return type.name;
  }

  let unspeakable = false;

  const parameterNames = type.templateMapper.args.map((t) => {
    switch (t.kind) {
      case "Model":
      case "Scalar":
      case "Interface":
      case "Operation":
      case "Enum":
      case "Union":
      case "Intrinsic":
        if (!t.name) {
          unspeakable = true;
          return undefined;
        }
        const declName = emitter.emitDeclarationName(t);
        if (declName === undefined) {
          unspeakable = true;
          return undefined;
        }
        return declName[0].toUpperCase() + declName.slice(1);
      default:
        unspeakable = true;
        return undefined;
    }
  });

  if (unspeakable) {
    return undefined;
  }

  return type.name + parameterNames.join("");
};

export const WriteAllFiles: TypeEmitterHook<any, any>["writeOutput"] = async ({
  emitter,
  sourceFiles,
}) => {
  for (const file of sourceFiles) {
    const outputFile = await emitter.emitSourceFile(file);
    await emitFile(emitter.getProgram(), {
      path: outputFile.path,
      content: outputFile.contents,
    });
  }
};

export const EmitAllTypesInNamespace: TypeEmitterHook<any, any>["namespace"] = ({
  type,
  emitter,
}) => {
  for (const ns of type.namespaces.values()) {
    emitter.emitType(ns);
  }

  for (const model of type.models.values()) {
    if (!isTemplateDeclaration(model)) {
      emitter.emitType(model);
    }
  }

  for (const operation of type.operations.values()) {
    if (!isTemplateDeclaration(operation)) {
      emitter.emitType(operation);
    }
  }

  for (const enumeration of type.enums.values()) {
    emitter.emitType(enumeration);
  }

  for (const union of type.unions.values()) {
    if (!isTemplateDeclaration(union)) {
      emitter.emitType(union);
    }
  }

  for (const iface of type.interfaces.values()) {
    if (!isTemplateDeclaration(iface)) {
      emitter.emitType(iface);
    }
  }

  for (const scalar of type.scalars.values()) {
    emitter.emitType(scalar);
  }

  return emitter.result.none();
};
