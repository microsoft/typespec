import { Program } from "@typespec/compiler";
import { logError, spawnAsync } from "./utils.js";

export const JDK_NOT_FOUND_MESSAGE =
  "Java Development Kit (JDK) is not found in PATH. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download";

export async function validateDependencies(
  program: Program | undefined,
  logDiagnostic: boolean = false,
) {
  // Check JDK and version
  try {
    const result = await spawnAsync("javac", ["-version"], { stdio: "pipe" });
    const javaVersion = findJavaVersion(result.stdout) ?? findJavaVersion(result.stderr);
    if (javaVersion) {
      if (javaVersion < 11) {
        // the message is JDK 17, because clientcore depends on JDK 17
        // emitter only require JDK 11
        const message = `Java Development Kit (JDK) in PATH is version ${javaVersion}. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download`;
        // // eslint-disable-next-line no-console
        // console.log("[ERROR] " + message);
        if (program && logDiagnostic) {
          logError(program, message);
        }
      }
    }
  } catch (error: any) {
    let message = error.message;
    if (error && "code" in error && error["code"] === "ENOENT") {
      message = JDK_NOT_FOUND_MESSAGE;
    }
    // // eslint-disable-next-line no-console
    // console.log("[ERROR] " + message);
    if (program && logDiagnostic) {
      logError(program, message);
    }
  }

  // Check Maven
  // nodejs does not allow spawn of .cmd on win32
  const shell = process.platform === "win32";
  try {
    await spawnAsync("mvn", ["-v"], { stdio: "pipe", shell: shell });
  } catch (error: any) {
    let message = error.message;
    if (shell || (error && "code" in error && error["code"] === "ENOENT")) {
      message =
        "Apache Maven is not found in PATH. Apache Maven can be downloaded from https://maven.apache.org/download.cgi";
    }
    // // eslint-disable-next-line no-console
    // console.log("[ERROR] " + message);
    if (program && logDiagnostic) {
      logError(program, message);
    }
  }
}

function findJavaVersion(output: string): number | undefined {
  const regex = /javac (\d+)\.(\d+)\..*/;
  const matches = output.match(regex);
  if (matches && matches.length > 2) {
    if (matches[1] === "1") {
      // "javac 1.8.0_422" -> 8
      return +matches[2];
    } else {
      // "javac 21.0.3" -> 21
      return +matches[1];
    }
  }
  return undefined;
}
