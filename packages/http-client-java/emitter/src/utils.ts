import { Diagnostic, Program, Type } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";

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
    (type.kind === "Interface" ||
      type.kind === "Model" ||
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

export function stringArrayContainsIgnoreCase(stringList: string[], str: string): boolean {
  return stringList && str
    ? stringList.findIndex((s) => s.toLowerCase() === str.toLowerCase()) !== -1
    : false;
}

export function removeClientSuffix(clientName: string): string {
  const clientSuffix = "Client";
  return clientName.endsWith(clientSuffix) ? clientName.slice(0, -clientSuffix.length) : clientName;
}

export type SpawnReturns = {
  stdout: string;
  stderr: string;
};

export class SpawnError extends Error {
  stdout: string;
  stderr: string;

  constructor(message: string, stdout: string, stderr: string) {
    super(message);
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export class DiagnosticError extends Error {
  diagnostic: Diagnostic;

  constructor(diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.diagnostic = diagnostic;
  }
}

export async function spawnAsync(
  command: string,
  args: readonly string[],
  options: SpawnOptions,
): Promise<SpawnReturns> {
  return new Promise<SpawnReturns>((resolve, reject) => {
    const childProcess = spawn(command, args, options);

    let error: Error | undefined = undefined;

    // std
    const stdout: string[] = [];
    const stderr: string[] = [];
    if (childProcess.stdout) {
      childProcess.stdout.on("data", (data) => {
        stdout.push(data.toString());
      });
    }
    if (childProcess.stderr) {
      childProcess.stderr.on("data", (data) => {
        stderr.push(data.toString());
      });
    }

    // failed to spawn the process
    childProcess.on("error", (e) => {
      error = e;
    });

    // process exits with error
    childProcess.on("exit", (code, signal) => {
      if (code !== 0) {
        if (code) {
          error = new SpawnError(
            `${command} ended with code '${code}'.`,
            stdout.join(""),
            stderr.join(""),
          );
        } else {
          error = new Error(`${command} terminated by signal '${signal}'.`);
        }
      }
    });

    // close and complete Promise
    childProcess.on("close", () => {
      if (error) {
        reject(error);
      } else {
        resolve({
          stdout: stdout.join(""),
          stderr: stderr.join(""),
        });
      }
    });
  });
}

/**
 * Converts the value of an option to a boolean.
 *
 * The function is useful when the option is provided in typespec command line, and the option is not explicitly documented in the EmitterOptionsSchema.
 *
 * @param option The option flag.
 * @returns the boolean value of the option. `undefined` if the option is not set
 */
export function optionBoolean(option: boolean | string | undefined): boolean | undefined {
  if (typeof option === "boolean") {
    return option;
  } else if (typeof option === "string") {
    if (option.toLowerCase() === "true") {
      return true;
    } else {
      return false;
    }
  }
  return undefined;
}

export function escapeJavaKeywords(name: string, suffix: string): string {
  return JAVA_KEYWORDS.has(name) ? name + suffix : name;
}

// https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
const JAVA_KEYWORDS: Set<string> = new Set<string>([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
]);
