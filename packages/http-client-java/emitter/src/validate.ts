import type { Program } from "@typespec/compiler";
import { NoTarget } from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";
import { spawnAsync, trace } from "./utils.js";

export const JDK_NOT_FOUND_MESSAGE =
  "Java Development Kit (JDK) is not found in PATH. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download";
export const CODE_JAVA_SDK_DEPENDENCY = "invalid-java-sdk-dependency";

export async function validateDependencies(
  program: Program | undefined,
  logDiagnostic: boolean = false,
) {
  // Check Java Runtime and version
  try {
    const result = await spawnAsync("java", ["-version"], { stdio: "pipe" });
    const javaRuntimeVersion =
      findJavaRuntimeVersion(result.stdout) ?? findJavaRuntimeVersion(result.stderr);
    if (javaRuntimeVersion) {
      if (program && logDiagnostic) {
        trace(program, `Java Runtime in PATH is version ${javaRuntimeVersion}.`);
      }
      const javaMajorVersion = getJavaMajorVersion(javaRuntimeVersion);
      if (javaMajorVersion < 11) {
        if (program && logDiagnostic) {
          reportDiagnostic(program, {
            code: "invalid-java-sdk-dependency",
            messageId: "javaVersion",
            format: { javaVersion: javaRuntimeVersion },
            target: NoTarget,
          });
        }
      }
    }
  } catch (error: any) {
    if (error && "code" in error && error["code"] === "ENOENT") {
      if (program && logDiagnostic) {
        reportDiagnostic(program, {
          code: "invalid-java-sdk-dependency",
          messageId: "java",
          target: NoTarget,
        });
      }
    } else {
      if (program && logDiagnostic) {
        reportDiagnostic(program, {
          code: "unknown-error",
          format: { errorMessage: error.message },
          target: NoTarget,
        });
      }
    }
  }
}

export function getJavaMajorVersion(version: string): number {
  let matches = version.match(/(\d+)\.(\d+).*/);
  if (matches && matches.length > 2) {
    // match pattern "major.minor*"
    if (matches[1] === "1") {
      // "1.8.0_422" -> 8
      return +matches[2];
    } else {
      // "21.0.3" -> 21
      return +matches[1];
    }
  } else {
    // match pattern "major*"
    matches = version.match(/(\d+).*/);
    if (matches && matches.length > 1) {
      // "24" -> 24
      return +matches[1];
    }
  }
  return 0;
}

export function findJavaRuntimeVersion(output: string): string | undefined {
  // "java version "21.0.3"" or "openjdk version "17.0.11""
  const matches = output.match(/version "?([\d.]+)"?.*/);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return undefined;
}
