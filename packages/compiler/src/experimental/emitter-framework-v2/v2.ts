import { isTemplateDeclaration } from "../index.js";
import { EmitterInit, NamespaceProps } from "./types.js";

export function createEmitter<Output, Context>(init: EmitterInit<Output, Context>) {}

export function emitAllTypesInNamespace({ namespace, emitter }: NamespaceProps<unknown>) {
  for (const ns of namespace.namespaces.values()) {
    emitter.emitType(ns);
  }

  for (const model of namespace.models.values()) {
    if (!isTemplateDeclaration(model)) {
      emitter.emitType(model);
    }
  }

  for (const operation of namespace.operations.values()) {
    if (!isTemplateDeclaration(operation)) {
      emitter.emitType(operation);
    }
  }

  for (const enumeration of namespace.enums.values()) {
    emitter.emitType(enumeration);
  }

  for (const union of namespace.unions.values()) {
    if (!isTemplateDeclaration(union)) {
      emitter.emitType(union);
    }
  }

  for (const iface of namespace.interfaces.values()) {
    if (!isTemplateDeclaration(iface)) {
      emitter.emitType(iface);
    }
  }

  for (const scalar of namespace.scalars.values()) {
    emitter.emitType(scalar);
  }

  return emitter.result.none();
}
