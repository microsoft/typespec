import { Program } from "@typespec/compiler";
import { asyncSpawn, logError } from "./utils.js";

export async function validateDependencies(program: Program, logDiagnostic: boolean = false) {
  // Check JDK and version
  try {
    await asyncSpawn("javac", ["-version"]);
  } catch (error: any) {
    let message = error.message;
    if (error && "code" in error && error["code"] === "ENOENT") {
      message =
        "JDK Development Kit is not found in PATH. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download";
    }
    console.log(message);
    if (logDiagnostic) {
      logError(program, message);
    }
  }

  // Check Maven
  try {
    await asyncSpawn("mvn", ["-v"]);
  } catch (error: any) {
    let message = error.message;
    if (error && "code" in error && error["code"] === "ENOENT") {
      message =
        "JDK Development Kit is not found in PATH. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download";
    }
    console.log(message);
    if (logDiagnostic) {
      logError(program, message);
    }
  }
}
