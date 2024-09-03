export function generateNamespaceName(name: string): string {
  return name.replaceAll(/[^\w^\d_]+/g, "");
}
