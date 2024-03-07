// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { createSdkContext } from "@azure-tools/typespec-client-generator-core";
import {
    Program,
    resolvePath,
    EmitContext,
    createTypeSpecLibrary,
    paramMessage,
    logDiagnostics
} from "@typespec/compiler";

import { stringifyRefs, PreserveType } from "json-serialize-refs";
import fs, { existsSync } from "fs";
import path from "node:path";
import { Configuration } from "./type/configuration.js";
import { execSync } from "child_process";
import {
    NetEmitterOptions,
    NetEmitterOptionsSchema,
    resolveOptions,
    resolveOutputFolder
} from "./options.js";
import { createModel } from "./lib/clientModelBuilder.js";
import { logger, LoggerLevel } from "./lib/logger.js";
import { tspOutputFileName, configurationFileName } from "./constants.js";

export const $lib = createTypeSpecLibrary({
    name: "@azure-tools/typespec-csharp",
    diagnostics: {
        "No-APIVersion": {
            severity: "error",
            messages: {
                default: paramMessage`No APIVersion Provider for service ${"service"}`
            }
        },
        "No-Route": {
            severity: "error",
            messages: {
                default: paramMessage`No Route for service for service ${"service"}`
            }
        }
    },
    emitter: {
        options: NetEmitterOptionsSchema
    }
});

export async function $onEmit(context: EmitContext<NetEmitterOptions>) {
    const program: Program = context.program;
    const options = resolveOptions(context);
    const outputFolder = resolveOutputFolder(context);

    /* set the loglevel. */
    for (const transport of logger.transports) {
        transport.level = options.logLevel ?? LoggerLevel.INFO;
    }

    if (!program.compilerOptions.noEmit && !program.hasError()) {
        // Write out the dotnet model to the output path
        const sdkContext = createSdkContext(
            context,
            "@azure-tools/typespec-csharp"
        );
        const root = createModel(sdkContext);
        if (
            context.program.diagnostics.length > 0 &&
            context.program.diagnostics.filter(
                (digs) => digs.severity === "error"
            ).length > 0
        ) {
            logDiagnostics(
                context.program.diagnostics,
                context.program.host.logSink
            );
            process.exit(1);
        }
        const tspNamespace = root.Name; // this is the top-level namespace defined in the typespec file, which is actually always different from the namespace of the SDK
        // await program.host.writeFile(outPath, prettierOutput(JSON.stringify(root, null, 2)));
        if (root) {
            const generatedFolder = outputFolder.endsWith("src")
                ? resolvePath(outputFolder, "Generated")
                : resolvePath(outputFolder, "src", "Generated");

            //resolve shared folders based on generator path override
            const resolvedSharedFolders: string[] = [];
            const sharedFolders = [
                resolvePath(
                    options.csharpGeneratorPath,
                    "..",
                    "Generator.Shared"
                ),
                resolvePath(
                    options.csharpGeneratorPath,
                    "..",
                    "Azure.Core.Shared"
                )
            ];
            for (const sharedFolder of sharedFolders) {
                resolvedSharedFolders.push(
                    path
                        .relative(generatedFolder, sharedFolder)
                        .replaceAll("\\", "/")
                );
            }

            if (!fs.existsSync(generatedFolder)) {
                fs.mkdirSync(generatedFolder, { recursive: true });
            }

            await program.host.writeFile(
                resolvePath(generatedFolder, tspOutputFileName),
                prettierOutput(
                    stringifyRefs(root, null, 1, PreserveType.Objects)
                )
            );

            //emit configuration.json
            const configurations: Configuration = {
                "output-folder": ".",
                namespace: options.namespace ?? tspNamespace,
                "library-name":
                    options["library-name"] ??
                    options.namespace ??
                    tspNamespace,
                "shared-source-folders": resolvedSharedFolders ?? [],
                "single-top-level-client": options["single-top-level-client"],
                "unreferenced-types-handling":
                    options["unreferenced-types-handling"],
                "keep-non-overloadable-protocol-signature":
                    options["keep-non-overloadable-protocol-signature"],
                "model-namespace": options["model-namespace"],
                "models-to-treat-empty-string-as-null":
                    options["models-to-treat-empty-string-as-null"],
                "intrinsic-types-to-treat-empty-string-as-null": options[
                    "models-to-treat-empty-string-as-null"
                ]
                    ? options[
                          "additional-intrinsic-types-to-treat-empty-string-as-null"
                      ].concat(
                          [
                              "Uri",
                              "Guid",
                              "ResourceIdentifier",
                              "DateTimeOffset"
                          ].filter(
                              (item) =>
                                  options[
                                      "additional-intrinsic-types-to-treat-empty-string-as-null"
                                  ].indexOf(item) < 0
                          )
                      )
                    : undefined,
                "methods-to-keep-client-default-value":
                    options["methods-to-keep-client-default-value"],
                "head-as-boolean": options["head-as-boolean"],
                "deserialize-null-collection-as-null-value":
                    options["deserialize-null-collection-as-null-value"],
                //only emit these if they are not the default values
                branded:
                    options["branded"] === true
                        ? undefined
                        : options["branded"],
                "generate-sample-project":
                    options["generate-sample-project"] === true
                        ? undefined
                        : options["generate-sample-project"],
                "generate-test-project":
                    options["generate-test-project"] === false
                        ? undefined
                        : options["generate-test-project"],
                "use-model-reader-writer":
                    options["use-model-reader-writer"] ?? true,
                "azure-arm":
                    sdkContext.arm === false ? undefined : sdkContext.arm
            };

            await program.host.writeFile(
                resolvePath(generatedFolder, configurationFileName),
                prettierOutput(JSON.stringify(configurations, null, 2))
            );

            if (options.skipSDKGeneration !== true) {
                const csProjFile = resolvePath(
                    outputFolder,
                    `${configurations["library-name"]}.csproj`
                );
                logger.info(`Checking if ${csProjFile} exists`);
                const newProjectOption =
                    options["new-project"] || !existsSync(csProjFile)
                        ? "--new-project"
                        : "";
                const existingProjectOption = options["existing-project-folder"]
                    ? `--existing-project-folder ${options["existing-project-folder"]}`
                    : "";
                const debugFlag = options.debug ?? false ? " --debug" : "";

                const command = `dotnet --roll-forward Major ${resolvePath(
                    options.csharpGeneratorPath
                )} --project-path ${outputFolder} ${newProjectOption} ${existingProjectOption} --clear-output-folder ${
                    options["clear-output-folder"]
                }${debugFlag}`;
                logger.info(command);

                try {
                    execSync(command, { stdio: "inherit" });
                } catch (error: any) {
                    if (error.message) logger.info(error.message);
                    if (error.stderr) logger.error(error.stderr);
                    if (error.stdout) logger.verbose(error.stdout);
                    throw error;
                }
            }

            if (!options["save-inputs"]) {
                // delete
                deleteFile(resolvePath(generatedFolder, tspOutputFileName));
                deleteFile(resolvePath(generatedFolder, configurationFileName));
            }
        }
    }
}

function deleteFile(filePath: string) {
    fs.unlink(filePath, (err) => {
        if (err) {
            logger.error(`stderr: ${err}`);
        } else {
            logger.info(`File ${filePath} is deleted.`);
        }
    });
}

function prettierOutput(output: string) {
    return output + "\n";
}
