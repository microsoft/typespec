import {
  createTypeSpecLibrary,
  EmitContext,
  getNormalizedAbsolutePath,
  JSONSchemaType,
  NoTarget,
  resolvePath,
} from "@typespec/compiler";
import { spawn } from "child_process";
import { promises } from "fs";
import { dump } from "js-yaml";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { CodeModelBuilder } from "./code-model-builder.js";

export interface EmitterOptions {
  namespace?: string;
  "output-dir"?: string;
  "package-dir"?: string;

  flavor?: string;

  "service-name"?: string;
  "service-versions"?: string[];

  "skip-special-headers"?: string[];

  namer?: boolean;

  "generate-samples"?: boolean;
  "generate-tests"?: boolean;
  "examples-directory"?: string;

  "enable-sync-stack"?: boolean;
  "stream-style-serialization"?: boolean;

  "partial-update"?: boolean;
  "models-subpackage"?: string;
  "custom-types"?: string;
  "custom-types-subpackage"?: string;
  "customization-class"?: string;
  polling?: any;

  "group-etag-headers"?: boolean;

  "advanced-versioning"?: boolean;
  "api-version"?: string;
  "service-version-exclude-preview"?: boolean;

  "dev-options"?: DevOptions;
}

export interface DevOptions {
  "generate-code-model"?: boolean;
  debug?: boolean;
  loglevel?: "off" | "debug" | "info" | "warn" | "error";
  "java-temp-dir"?: string; // working directory for java codegen, e.g. transformed code-model file
}

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    namespace: { type: "string", nullable: true },
    "output-dir": { type: "string", nullable: true },
    "package-dir": { type: "string", nullable: true },

    flavor: { type: "string", nullable: true, default: "Azure" },

    // service
    "service-name": { type: "string", nullable: true },
    "service-versions": { type: "array", items: { type: "string" }, nullable: true },

    // header
    "skip-special-headers": { type: "array", items: { type: "string" }, nullable: true },

    // namer
    namer: { type: "boolean", nullable: true, default: false },

    // sample and test
    "generate-samples": { type: "boolean", nullable: true, default: true },
    "generate-tests": { type: "boolean", nullable: true, default: true },
    "examples-directory": { type: "string", nullable: true },

    "enable-sync-stack": { type: "boolean", nullable: true, default: true },
    "stream-style-serialization": { type: "boolean", nullable: true, default: true },

    // customization
    "partial-update": { type: "boolean", nullable: true, default: false },
    "models-subpackage": { type: "string", nullable: true },
    "custom-types": { type: "string", nullable: true },
    "custom-types-subpackage": { type: "string", nullable: true },
    "customization-class": { type: "string", nullable: true },
    polling: { type: "object", additionalProperties: true, nullable: true },

    "group-etag-headers": { type: "boolean", nullable: true },

    "advanced-versioning": { type: "boolean", nullable: true, default: false },
    "api-version": { type: "string", nullable: true },
    "service-version-exclude-preview": { type: "boolean", nullable: true, default: false },

    "dev-options": { type: "object", additionalProperties: true, nullable: true },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-java",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema,
  },
});

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const program = context.program;
  const options = context.options;
  if (!options["flavor"]) {
    if (options["package-dir"]?.toLocaleLowerCase().startsWith("azure")) {
      // Azure package
      options["flavor"] = "Azure";
    } else {
      // default
      options["flavor"] = "Azure";
    }
  }
  const builder = new CodeModelBuilder(program, context);
  const codeModel = await builder.build();

  if (!program.compilerOptions.noEmit && !program.hasError()) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const moduleRoot = resolvePath(__dirname, "..", "..");

    const outputPath = options["output-dir"] ?? context.emitterOutputDir;
    options["output-dir"] = getNormalizedAbsolutePath(outputPath, undefined);

    (options as any)["arm"] = codeModel.arm;

    const codeModelFileName = resolvePath(outputPath, "./code-model.yaml");

    await promises.mkdir(outputPath, { recursive: true }).catch((err) => {
      if (err.code !== "EISDIR" && err.code !== "EEXIST") {
        throw err;
      }
    });

    await program.host.writeFile(codeModelFileName, dump(codeModel));

    program.trace("http-client-java", `Code model file written to ${codeModelFileName}`);

    const emitterOptions = JSON.stringify(options);
    program.trace("http-client-java", `Emitter options ${emitterOptions}`);

    const jarFileName = resolvePath(
      moduleRoot,
      "generator/http-client-generator/target",
      "emitter.jar"
    );
    program.trace("http-client-java", `Exec JAR ${jarFileName}`);

    const javaArgs: string[] = [];
    javaArgs.push(`-DemitterOptions=${emitterOptions}`);
    if (options["dev-options"]?.debug) {
      javaArgs.push("-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005");
    }
    if (options["dev-options"]?.loglevel) {
      javaArgs.push("-Dorg.slf4j.simpleLogger.defaultLogLevel=" + options["dev-options"]?.loglevel);
    }
    if (options["dev-options"]?.["java-temp-dir"]) {
      javaArgs.push("-Dcodegen.java.temp.directory=" + options["dev-options"]?.["java-temp-dir"]);
    }
    javaArgs.push("-jar");
    javaArgs.push(jarFileName);
    javaArgs.push(codeModelFileName);
    try {
      type SpawnReturns = {
        stdout: string;
        stderr: string;
      };
      await new Promise<SpawnReturns>((resolve, reject) => {
        const childProcess = spawn("java", javaArgs, { stdio: "inherit" });

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
              error = new Error(`JAR ended with code '${code}'.`);
            } else {
              error = new Error(`JAR terminated by signal '${signal}'.`);
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

      // as stdio: "inherit", std is not captured by spawn
      // program.trace("http-client-java", output.stdout ? output.stdout : output.stderr);
    } catch (error: any) {
      if (error && "code" in error && error["code"] === "ENOENT") {
        const msg = "'java' is not on PATH. Please install JDK 11 or above.";
        program.trace("http-client-java", msg);
        program.reportDiagnostic({
          code: "http-client-java",
          severity: "error",
          message: msg,
          target: NoTarget,
        });
        throw new Error(msg);
      } else {
        throw error;
      }
    }

    if (!options["dev-options"]?.["generate-code-model"]) {
      await program.host.rm(codeModelFileName);
    }
  }
}
