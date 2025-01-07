import {
  createTypeSpecLibrary,
  EmitContext,
  getNormalizedAbsolutePath,
  JSONSchemaType,
  resolvePath,
} from "@typespec/compiler";
import { promises } from "fs";
import { dump } from "js-yaml";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { CodeModelBuilder } from "./code-model-builder.js";
import { CodeModel } from "./common/code-model.js";
import { logError, spawnAsync } from "./utils.js";
import { JDK_NOT_FOUND_MESSAGE, validateDependencies } from "./validate.js";

export interface EmitterOptions {
  namespace?: string;
  "package-dir"?: string;

  flavor?: string;

  "service-name"?: string;
  "service-versions"?: string[];

  "skip-special-headers"?: string[];

  "generate-samples"?: boolean;
  "generate-tests"?: boolean;

  "enable-sync-stack"?: boolean;
  "stream-style-serialization"?: boolean;
  "use-object-for-unknown"?: boolean;

  "partial-update"?: boolean;
  "models-subpackage"?: string;
  "custom-types"?: string;
  "custom-types-subpackage"?: string;
  "customization-class"?: string;
  polling?: any;

  "group-etag-headers"?: boolean;

  "enable-subclient"?: boolean;

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

type CodeModelEmitterOptions = EmitterOptions & {
  "output-dir": string;
  arm?: boolean;
};

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    namespace: { type: "string", nullable: true },
    "package-dir": { type: "string", nullable: true },

    flavor: { type: "string", nullable: true },

    // service
    "service-name": { type: "string", nullable: true },
    "service-versions": { type: "array", items: { type: "string" }, nullable: true },

    // header
    "skip-special-headers": { type: "array", items: { type: "string" }, nullable: true },

    // sample and test
    "generate-samples": { type: "boolean", nullable: true, default: true },
    "generate-tests": { type: "boolean", nullable: true, default: true },

    "enable-sync-stack": { type: "boolean", nullable: true, default: true },
    "stream-style-serialization": { type: "boolean", nullable: true, default: true },
    "use-object-for-unknown": { type: "boolean", nullable: true, default: false },

    // customization
    "partial-update": { type: "boolean", nullable: true, default: false },
    "models-subpackage": { type: "string", nullable: true },
    "custom-types": { type: "string", nullable: true },
    "custom-types-subpackage": { type: "string", nullable: true },
    "customization-class": { type: "string", nullable: true },
    polling: { type: "object", additionalProperties: true, nullable: true },

    "group-etag-headers": { type: "boolean", nullable: true },

    "enable-subclient": { type: "boolean", nullable: true, default: false },

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
  await validateDependencies(program, true);

  if (!program.hasError()) {
    const options = context.options;
    if (!options["flavor"]) {
      if ($lib.name === "@azure-tools/typespec-java") {
        options["flavor"] = "azure";
      }
    }

    let codeModel: CodeModel | undefined;
    try {
      const builder = new CodeModelBuilder(program, context);
      codeModel = await builder.build();
    } catch (error: any) {
      logError(program, error.message);
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
          logError(program, `Failed to create output directory: ${outputPath}`);
          return;
        }
      });

      await program.host.writeFile(codeModelFileName, dump(codeModel));

      program.trace("http-client-java", `Code model file written to ${codeModelFileName}`);

      const emitterOptions = JSON.stringify(options);
      program.trace("http-client-java", `Emitter options ${emitterOptions}`);

      const jarFileName = resolvePath(
        moduleRoot,
        "generator/http-client-generator/target",
        "emitter.jar",
      );
      program.trace("http-client-java", `Exec JAR ${jarFileName}`);

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
        await spawnAsync("java", javaArgs, { stdio: "inherit" });
      } catch (error: any) {
        if (error && "code" in error && error["code"] === "ENOENT") {
          logError(program, JDK_NOT_FOUND_MESSAGE);
        } else {
          logError(program, error.message);
        }
      }

      if (!options["dev-options"]?.["generate-code-model"]) {
        await program.host.rm(codeModelFileName);
      }
    }
  }
}
