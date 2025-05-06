import vscode from "vscode";
import logger from "../../log/logger.js";

export enum EmitterKind {
  Schema = "openapi",
  Client = "client",
  Server = "server",
  Unknown = "unknown",
}

export interface Emitter {
  language: string;
  package: string;
  version?: string;
  sourceRepo?: string;
  requisites?: string[];
  kind: EmitterKind;
}

export const PreDefinedEmitterPickItems: Record<string, vscode.QuickPickItem> = {
  openapi: {
    label: "OpenAPI Document",
    detail: "Emitting OpenAPI3 Document from TypeSpec files.",
  },
  client: {
    label: "Client Code",
    detail:
      "Emitting Client Code from TypeSpec files. Supported languages are .NET, Python, Java, JavaScript.",
  },
  server: {
    label: "Server Stub",
    detail: "Emitting Server Stub from TypeSpec files. Supported languages are .NET, JavaScript.",
  },
};

// TODO: remove this when we can load default emitters from the compiler
const PreDefinedEmitters: ReadonlyArray<Emitter> = [
  {
    language: ".NET",
    package: "@typespec/http-client-csharp",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-client-csharp",
    requisites: [".NET 8.0 SDK"],
    kind: EmitterKind.Client,
  },
  {
    language: "Java",
    package: "@typespec/http-client-java",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-client-java",
    requisites: ["Java 17 or above", "Maven"],
    kind: EmitterKind.Client,
  },
  {
    language: "JavaScript",
    package: "@typespec/http-client-js",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-client-js",
    kind: EmitterKind.Client,
  },
  {
    language: "Python",
    package: "@typespec/http-client-python",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-client-python",
    kind: EmitterKind.Client,
  },
  {
    language: ".NET",
    package: "@typespec/http-server-csharp",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-server-csharp",
    kind: EmitterKind.Server,
  },
  {
    language: "JavaScript",
    package: "@typespec/http-server-js",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/http-server-js",
    kind: EmitterKind.Server,
  },
  {
    language: "OpenAPI3",
    package: "@typespec/openapi3",
    sourceRepo: "https://github.com/microsoft/typespec/tree/main/packages/openapi3",
    kind: EmitterKind.Schema,
  },
];

function getEmitter(kind: EmitterKind, emitter: Emitter): Emitter | undefined {
  let packageFullName: string = emitter.package;
  if (!packageFullName) {
    logger.error("Emitter package name is required.");
    return undefined;
  }
  packageFullName = packageFullName.trim();
  const index = packageFullName.lastIndexOf("@");
  let version = undefined;
  let packageName = packageFullName;
  if (index !== -1 && index !== 0) {
    version = packageFullName.substring(index + 1);
    packageName = packageFullName.substring(0, index);
  }

  return {
    language: emitter.language,
    package: packageName,
    version: version,
    sourceRepo: emitter.sourceRepo,
    requisites: emitter.requisites,
    kind: kind,
  };
}

export function getRegisterEmitters(kind: EmitterKind): ReadonlyArray<Emitter> {
  const emitters: ReadonlyArray<Emitter> = PreDefinedEmitters;
  return emitters
    .filter((emitter) => emitter.kind === kind)
    .map((emitter) => getEmitter(kind, emitter))
    .filter((emitter) => emitter !== undefined) as Emitter[];
}

export function getRegisterEmitterTypes(): ReadonlyArray<EmitterKind> {
  const emitters: ReadonlyArray<Emitter> = PreDefinedEmitters;
  return Array.from(new Set(emitters.map((emitter) => emitter.kind)));
}

export function getRegisterEmittersByPackage(packageName: string): Emitter | undefined {
  const emitters: ReadonlyArray<Emitter> = PreDefinedEmitters;
  return emitters.find(
    (emitter) => emitter.package === packageName || emitter.package.startsWith(packageName + "@"),
  );
}

const languageAlias: Record<string, string> = {
  ".NET": "dotnet",
};

/*return the alias of the language if it exists, otherwise return the original language. */
export function getLanguageAlias(language: string): string {
  return languageAlias[language] ?? language;
}
