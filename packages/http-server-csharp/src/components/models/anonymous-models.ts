import type { Interface, Model } from "@typespec/compiler";

/** Map from anonymous models to their generated names (Model0, Model1, ...) */
const anonymousModelNames = new Map<Model, string>();
let anonymousModelCounter = 0;

/** Resets anonymous model state — call before each compilation. */
export function resetAnonymousModels(): void {
  anonymousModelNames.clear();
  anonymousModelCounter = 0;
}

/** Gets the generated name for an anonymous model, or undefined if it's not anonymous. */
export function getAnonymousModelName(model: Model): string | undefined {
  return anonymousModelNames.get(model);
}

export function assignAnonymousName(model: Model, contextualName?: string): string {
  let name = anonymousModelNames.get(model);
  if (!name) {
    name = contextualName ?? `Model${anonymousModelCounter++}`;
    anonymousModelNames.set(model, name);
  }
  return name;
}

/** Pre-assigns contextual names to anonymous response models before the diagnostic pre-pass. */
export function preAssignAnonymousResponseNames(interfaces: Interface[]): void {
  for (const iface of interfaces) {
    for (const [, op] of iface.operations) {
      const returnType = op.returnType;
      if (returnType.kind === "Model" && !returnType.name) {
        const opName = op.name.charAt(0).toUpperCase() + op.name.slice(1);
        const ctxName = iface.name.charAt(0).toUpperCase() + iface.name.slice(1);
        assignAnonymousName(returnType, `${ctxName}${opName}Response`);
      }
    }
  }
}
