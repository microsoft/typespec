import { EmitContext, getNormalizedAbsolutePath, NoTarget, resolvePath } from "@typespec/compiler";
import { promises } from "fs";
import { dump } from "js-yaml";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { CodeModelBuilder } from "./code-model-builder.js";
import { CodeModel } from "./common/code-model.js";
import { EmitterOptions, LibName, reportDiagnostic } from "./lib.js";
import { DiagnosticError, spawnAsync, SpawnError, trace } from "./utils.js";
import { validateDependencies } from "./validate.js";

type CodeModelEmitterOptions = EmitterOptions & {
  "output-dir": string;
  arm?: boolean;
};

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const program = context.program;
  if (!program.compilerOptions.noEmit) {
    await validateDependencies(program, true);
  }

  if (!program.hasError()) {
    const options = context.options;
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
          format: { errorMessage: error.message },
          target: NoTarget,
        });
        trace(program, error.stack);
      }
    }

    if (codeModel && !program.hasError() && !program.compilerOptions.noEmit) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const moduleRoot = resolvePath(__dirname, "..", "..");

      const outputPath = context.emitterOutputDir;
      (options as CodeModelEmitterOptions)["output-dir"] = getNormalizedAbsolutePath(
        outputPath,
        undefined,
      );

      (options as CodeModelEmitterOptions).arm = codeModel.arm;

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
        trace(program, `Code generation log: ${result.stdout}`);
      } catch (error: any) {
        if (error && "code" in error && error["code"] === "ENOENT") {
          reportDiagnostic(program, {
            code: "invalid-java-sdk-dependency",
            target: NoTarget,
          });
        } else {
          // error in Java codegen, report as unknown error
          reportDiagnostic(program, {
            code: "unknown-error",
            format: {
              errorMessage:
                'The emitter was unable to generate client code from this TypeSpec, please run this command again with "--trace http-client-java" to get diagnostic information, and open an issue on https://github.com/microsoft/typespec',
            },
            target: NoTarget,
          });
          if (error instanceof SpawnError) {
            trace(program, `Code generation error: ${error.stdout}`);
          }
        }
      }

      if (!options["dev-options"]?.["generate-code-model"]) {
        await program.host.rm(codeModelFileName);
      }
    }
  }
}
