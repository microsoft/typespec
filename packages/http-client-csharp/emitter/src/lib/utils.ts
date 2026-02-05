import {
  listAllServiceNamespaces,
  SdkClientType,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkMethodParameter,
  SdkModelPropertyType,
  isReadOnly as tcgcIsReadOnly,
} from "@azure-tools/typespec-client-generator-core";
import { getNamespaceFullName, Namespace, NoTarget, Type } from "@typespec/compiler";
import { Visibility } from "@typespec/http";
import { spawn, SpawnOptions } from "child_process";
import { CSharpEmitterContext } from "../sdk-context.js";

export async function execCSharpGenerator(
  context: CSharpEmitterContext,
  options: {
    generatorPath: string;
    outputFolder: string;
    generatorName: string;
    newProject: boolean;
    debug: boolean;
  },
): Promise<{ exitCode: number; stderr: string; proc: any }> {
  const command = "dotnet";
  const args = [
    "--roll-forward",
    "Major",
    options.generatorPath,
    options.outputFolder,
    "-g",
    options.generatorName,
  ];
  if (options.newProject) {
    args.push("--new-project");
  }
  if (options.debug) {
    args.push("--debug");
  }
  context.logger.info(`${command} ${args.join(" ")}`);

  const child = spawn(command, args, { stdio: "pipe" });

  const stderr: Buffer[] = [];
  return new Promise((resolve, reject) => {
    let buffer = "";

    child.stdout?.on("data", (data) => {
      buffer += data.toString();
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        const message = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        processJsonRpc(context, message);
      }
    });

    child.stderr?.on("data", (data) => {
      stderr.push(data);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

function processJsonRpc(context: CSharpEmitterContext, message: string) {
  const response = JSON.parse(message);
  const method = response.method;
  const params = response.params;
  switch (method) {
    case "trace":
      context.logger.trace(params.level, params.message);
      break;
    case "diagnostic":
      let crossLanguageDefinitionId: string | undefined;
      if ("crossLanguageDefinitionId" in params) {
        crossLanguageDefinitionId = params.crossLanguageDefinitionId;
      }
      // Use program.reportDiagnostic for diagnostics from C# so that we don't
      // have to duplicate the codes in the emitter.
      context.program.reportDiagnostic({
        code: params.code,
        message: params.message,
        severity: params.severity,
        target: findTarget(crossLanguageDefinitionId) ?? NoTarget,
      });
      break;
  }

  function findTarget(crossLanguageDefinitionId: string | undefined): Type | undefined {
    if (crossLanguageDefinitionId === undefined) {
      return undefined;
    }
    return context.__typeCache.crossLanguageDefinitionIds.get(crossLanguageDefinitionId);
  }
}

export async function execAsync(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; stdio: string; stdout: string; stderr: string; proc: any }> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdio: Buffer[] = [];
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (data) => {
      stdout.push(data);
      stdio.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
      stdio.push(data);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdio: Buffer.concat(stdio).toString(),
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

export function getClientNamespaceString(context: CSharpEmitterContext): string | undefined {
  const packageName = context.emitContext.options["package-name"];
  const serviceNamespaces = listAllServiceNamespaces(context);
  const firstNamespace = serviceNamespaces.length > 0 ? serviceNamespaces[0] : undefined;
  // namespace is not a public emitter option, but it is supported by TCGC
  const namespaceOverride = (context.emitContext.options as any).namespace;

  if (packageName) {
    return getClientNamespaceStringHelper(namespaceOverride, packageName, firstNamespace);
  }

  if (containsMultiServiceClient(context.sdkPackage.clients)) {
    return getClientNamespaceStringHelper(
      namespaceOverride,
      context.sdkPackage.clients[0].namespace,
    );
  }

  return getClientNamespaceStringHelper(namespaceOverride, undefined, firstNamespace);
}

export function getClientNamespaceStringHelper(
  namespaceOverride?: string,
  packageName?: string,
  namespace?: Namespace,
): string | undefined {
  if (namespaceOverride) {
    return namespaceOverride;
  }
  if (packageName) {
    packageName = packageName
      .replace(/-/g, ".")
      .replace(/\.([a-z])?/g, (match: string) => match.toUpperCase());
    return packageName.charAt(0).toUpperCase() + packageName.slice(1);
  }
  if (namespace) {
    return getNamespaceFullName(namespace);
  }
  return undefined;
}

export function firstLetterToUpperCase(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if the property or parameter is read-only.
 * @param prop - The property to check.
 * @beta
 */
export function isReadOnly(
  p: SdkModelPropertyType | SdkMethodParameter | SdkHttpParameter,
): boolean {
  if (p.kind === "property") {
    return tcgcIsReadOnly(p);
  }

  if (p.visibility?.includes(Visibility.Read) && p.visibility.length === 1) {
    return true;
  } else {
    return false;
  }
}

/**
 * Determines if the library contains a multiservice client.
 *
 * @param rootClients - Array of root clients from the SDK package
 * @returns True if this is a multiservice client library, false otherwise
 * @beta
 */
export function containsMultiServiceClient(
  rootClients: SdkClientType<SdkHttpOperation>[],
): boolean {
  if (rootClients.length === 0) {
    return false;
  }

  return isMultiServiceClient(rootClients[0]);
}

/**
 * Determines if a client is a multiservice client.
 * A multiservice client is one where the underlying service is an array of services
 * with more than one element.
 *
 * @param client - The SDK client to check
 * @returns True if this is a multiservice client, false otherwise
 * @beta
 */
export function isMultiServiceClient(client: SdkClientType<SdkHttpOperation>): boolean {
  return Array.isArray(client.__raw.service) && client.__raw.service.length > 1;
}
