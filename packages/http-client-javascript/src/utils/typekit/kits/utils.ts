import { Model, Namespace } from "@typespec/compiler";

export function getAllModels(namespace: Namespace): Model[] {
  return namespace.children.filter((child) => child.kind === "Model") as Model[];
}
