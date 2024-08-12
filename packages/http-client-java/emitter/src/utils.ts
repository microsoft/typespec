import { NoTarget, Program, Type } from "@typespec/compiler";

export function logWarning(program: Program, msg: string) {
  trace(program, msg);
  program.reportDiagnostic({
    code: "http-client-java",
    severity: "warning",
    message: msg,
    target: NoTarget,
  });
}

export function trace(program: Program, msg: string) {
  program.trace("http-client-java", msg);
}

export function pascalCase(name: string): string {
  if (name.length > 0) {
    return name[0].toUpperCase() + name.slice(1);
  } else {
    return name;
  }
}

export function getNamespace(type: Type | undefined): string | undefined {
  if (
    type &&
    (type.kind === "Model" ||
      type.kind === "Enum" ||
      type.kind === "Union" ||
      type.kind === "Operation")
  ) {
    let namespaceRef = type.namespace;
    let namespaceStr: string | undefined = undefined;
    while (namespaceRef && namespaceRef.name.length !== 0) {
      namespaceStr = namespaceRef.name + (namespaceStr ? "." + namespaceStr : "");
      namespaceRef = namespaceRef.namespace;
    }
    return namespaceStr;
  } else {
    return undefined;
  }
}

export function getJavaNamespace(namespace: string | undefined): string | undefined {
  return namespace ? "com." + namespace.toLowerCase() : undefined;
}

export function stringArrayContainsIgnoreCase(stringList: string[], str: string): boolean {
  return stringList && str
    ? stringList.findIndex((s) => s.toLowerCase() === str.toLowerCase()) !== -1
    : false;
}
