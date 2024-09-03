import {
  $encodedName,
  type DecoratorContext,
  type Enum,
  type ModelProperty,
  type Program,
  type Type,
} from "@typespec/compiler";
import type {
  AttributeDecorator,
  NameDecorator,
  NsDeclarationsDecorator,
  NsDecorator,
  UnwrappedDecorator,
} from "../generated-defs/TypeSpec.Xml.js";
import { XmlStateKeys, reportDiagnostic } from "./lib.js";
import type { XmlNamespace } from "./types.js";

/** @internal */
export const namespace = "TypeSpec.Xml";

export const $name: NameDecorator = (context, target, name) => {
  context.call($encodedName, target, "application/xml", name);
};

export const $attribute: AttributeDecorator = (context, target) => {
  context.program.stateSet(XmlStateKeys.attribute).add(target);
};

/**
 * Check if the given property should be serialized as an attribute instead of a node.
 */
export function isAttribute(program: Program, target: ModelProperty): boolean {
  return program.stateSet(XmlStateKeys.attribute).has(target);
}

export const $unwrapped: UnwrappedDecorator = (context, target) => {
  context.program.stateSet(XmlStateKeys.unwrapped).add(target);
};

/**
 * Check if the given property should be unwrapped in the XML containing node.
 */
export function isUnwrapped(program: Program, target: ModelProperty): boolean {
  return program.stateSet(XmlStateKeys.unwrapped).has(target);
}

export const $nsDeclarations: NsDeclarationsDecorator = (context, target) => {
  context.program.stateSet(XmlStateKeys.nsDeclaration).add(target);
};

function isNsDeclarationsEnum(program: Program, target: Enum): boolean {
  return program.stateSet(XmlStateKeys.nsDeclaration).has(target);
}

export const $ns: NsDecorator = (context, target, namespace: Type, prefix?: string) => {
  const data = getData(context, namespace, prefix);
  if (data) {
    if (validateNamespaceIsUri(context, data.namespace)) {
      context.program.stateMap(XmlStateKeys.nsDeclaration).set(target, data);
    }
  }
};

/**
 * Get the namespace and prefix for the given type.
 */
export function getNs(program: Program, target: Type): XmlNamespace | undefined {
  return program.stateMap(XmlStateKeys.nsDeclaration).get(target);
}

function getData(
  context: DecoratorContext,
  namespace: Type,
  prefix?: string
): XmlNamespace | undefined {
  switch (namespace.kind) {
    case "String":
      if (!prefix) {
        reportDiagnostic(context.program, {
          code: "ns-missing-prefix",
          target: context.decoratorTarget,
        });
        return undefined;
      }
      return { namespace: namespace.value, prefix };
    case "EnumMember":
      if (!isNsDeclarationsEnum(context.program, namespace.enum)) {
        reportDiagnostic(context.program, {
          code: "ns-enum-not-declaration",
          target: context.decoratorTarget,
        });
        return undefined;
      }
      if (prefix !== undefined) {
        reportDiagnostic(context.program, {
          code: "prefix-not-allowed",
          target: context.getArgumentTarget(1)!,
          format: { name: namespace.name },
        });
      }
      if (typeof namespace.value !== "string") {
        reportDiagnostic(context.program, {
          code: "invalid-ns-declaration-member",
          target: context.decoratorTarget,
          format: { name: namespace.name },
        });
        return undefined;
      }
      return { namespace: namespace.value, prefix: namespace.name };
    default:
      return undefined;
  }
}

function validateNamespaceIsUri(context: DecoratorContext, namespace: string) {
  try {
    new URL(namespace);
    return true;
  } catch {
    reportDiagnostic(context.program, {
      code: "ns-not-uri",
      target: context.getArgumentTarget(0)!,
      format: { namespace },
    });
    return false;
  }
}
