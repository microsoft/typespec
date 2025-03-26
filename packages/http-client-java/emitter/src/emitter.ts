import {
  EmitContext,
  getNormalizedAbsolutePath,
  NoTarget,
  Program,
  resolvePath,
} from "@typespec/compiler";
import { promises } from "fs";
import { dump } from "js-yaml";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { CodeModelBuilder, EmitterOptionsDev } from "./code-model-builder.js";
import { CodeModel } from "./common/code-model.js";
import { LibName, reportDiagnostic } from "./lib.js";
import { EmitterOptions } from "./options.js";
import { DiagnosticError, spawnAsync, SpawnError, trace } from "./utils.js";
import { validateDependencies } from "./validate.js";

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const program = context.program;
  if (!program.compilerOptions.noEmit) {
    await validateDependencies(program, true);
  }

  if (!program.hasError()) {
    const options = context.options as EmitterOptionsDev;
    if (!options["flavor"]) {
      if (LibName === "@azure-tools/typespec-java") {
        options["flavor"] = "azure";
      }
    }

    let codeModel: CodeModel | undefined;
    try {
      const builder = new CodeModelBuilder(program, context);
      codeModel = await builder.build();
    } catch (error: any) {
      if (error instanceof DiagnosticError) {
        // diagnostic thrown as error
        program.reportDiagnostic(error.diagnostic);
      } else {
        // unknown error
        reportDiagnostic(program, {
          code: "unknown-error",
          format: {
            errorMessage: `The emitter was unable to generate client code from this TypeSpec, please open an issue on https://github.com/microsoft/typespec, include TypeSpec source and all the diagnostic information in your submission.\nStack: error.stack`,
          },
          target: NoTarget,
        });
        trace(program, error.stack);
      }
    }

    if (codeModel && !program.hasError() && !program.compilerOptions.noEmit) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const moduleRoot = resolvePath(__dirname, "..", "..");

      const outputPath = context.emitterOutputDir;
      options["output-dir"] = getNormalizedAbsolutePath(outputPath, undefined);

      options.arm = codeModel.arm;
      if (codeModel.info?.license?.extensions?.header) {
        options["license-header"] = codeModel.info.license.extensions.header;
      }

      const codeModelFileName = resolvePath(outputPath, "./code-model.yaml");

      await promises.mkdir(outputPath, { recursive: true }).catch((err) => {
        if (err.code !== "EISDIR" && err.code !== "EEXIST") {
          reportDiagnostic(program, {
            code: "unknown-error",
            format: { errorMessage: `Failed to create output directory: ${outputPath}.` },
            target: NoTarget,
          });
          return;
        }
      });

      await program.host.writeFile(codeModelFileName, dump(codeModel));

      trace(program, `Code model file written to ${codeModelFileName}`);

      const emitterOptions = JSON.stringify(options);
      trace(program, `Emitter options ${emitterOptions}`);

      const jarFileName = resolvePath(
        moduleRoot,
        "generator/http-client-generator/target",
        "emitter.jar",
      );
      trace(program, `Exec JAR ${jarFileName}`);

      const javaArgs: string[] = [];
      javaArgs.push(`-DemitterOptions=${emitterOptions}`);
      if (options["dev-options"]?.debug) {
        javaArgs.push("-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005");
      }
      if (options["dev-options"]?.loglevel) {
        javaArgs.push(
          "-Dorg.slf4j.simpleLogger.defaultLogLevel=" + options["dev-options"]?.loglevel,
        );
      }
      if (options["dev-options"]?.["java-temp-dir"]) {
        javaArgs.push("-Dcodegen.java.temp.directory=" + options["dev-options"]?.["java-temp-dir"]);
      }
      javaArgs.push("-jar");
      javaArgs.push(jarFileName);
      javaArgs.push(codeModelFileName);
      try {
        const result = await spawnAsync("java", javaArgs, { stdio: "pipe" });
        reportJarOutput(program, result.stdout);
        // trace(program, `Code generation log: ${result.stdout}`);
      } catch (error: any) {
        if (error && "code" in error && error["code"] === "ENOENT") {
          reportDiagnostic(program, {
            code: "invalid-java-sdk-dependency",
            target: NoTarget,
          });
        } else {
          if (error instanceof SpawnError) {
            reportJarOutput(program, error.stdout);
            // trace(program, `Code generation log: ${error.stdout}`);
          }

          // error in Java codegen, report as unknown error
          reportDiagnostic(program, {
            code: "unknown-error",
            format: {
              errorMessage: `The emitter was unable to generate client code from this TypeSpec, please open an issue on https://github.com/microsoft/typespec, include TypeSpec source and all the diagnostic information in your submission.`,
            },
            target: NoTarget,
          });
        }
      }

      if (!options["dev-options"]?.["generate-code-model"]) {
        await program.host.rm(codeModelFileName);
      }
    }
  }
}

function reportJarOutput(program: Program, jarOutput: string) {
  const lines = jarOutput.split("\n");
  const logs: Array<string> = [];

  // parse stdout to array of logs
  let currentLog = undefined;
  for (const line of lines) {
    if (
      line.startsWith("TRACE ") ||
      line.startsWith("DEBUG ") ||
      line.startsWith("INFO ") ||
      line.startsWith("WARN ") ||
      line.startsWith("ERROR ")
    ) {
      if (currentLog) {
        logs.push(currentLog);
      }
      currentLog = line;
    } else if (currentLog) {
      currentLog = currentLog + "\n" + line;
    }
  }
  if (currentLog) {
    logs.push(currentLog);
  }

  // trace or report the logs, according to log level
  for (const log of logs) {
    if (log.startsWith("ERROR ")) {
      reportDiagnostic(program, {
        code: "generator-error",
        format: {
          errorMessage: log.substring(6),
        },
        target: NoTarget,
      });
    } else if (log.startsWith("WARN ")) {
      reportDiagnostic(program, {
        code: "generator-warning",
        format: {
          warningMessage: log.substring(5),
        },
        target: NoTarget,
      });
    } else {
      const index = log.indexOf(" ");
      trace(program, log.substring(index + 1));
    }
  }
}
