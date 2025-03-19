/* eslint-disable no-console */
import { resolvePath, typespecVersion } from "@typespec/compiler";
import { spawn } from "cross-spawn";
import pc from "picocolors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  console.log(`TypeSpec Http Server Emitter for C-Sharp v${typespecVersion}\n`);

  await yargs(hideBin(process.argv))
    .scriptName("hscs")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .command(
      "scaffold [--use-swaggerui] <project-directory> <path-to-spec>",
      "Generate a complete project with mock implementation at the given project-directory for the given spec.  This required dotnet 9: https://dotnet.microsoft.com/download.",
      (cmd) => {
        return cmd
          .option("use-swaggerui", {
            description:
              "Include generated OpenAPI and a SwaggerUI endpoint in the service project.  THIS OPTION REQUIRES '@typespec/openapi3' as a dependency of your typespec project.",
            type: "boolean",
            default: false,
          })
          .positional("project-directory", {
            description: "Path to the directory where the project will be created.",
            type: "string",
            demandOption: true,
          })
          .positional("path-to-spec", {
            description: "The path to the spec to generate a project for",
            type: "string",
            demandOption: true,
          });
      },
      async (args) => {
        const projectDir = resolvePath(process.cwd(), args["project-directory"]);
        const pathToSpec = resolvePath(process.cwd(), args["path-to-spec"]);
        const useSwagger: boolean = args["use-swaggerui"];
        console.log(pc.bold("Generating new Project"));
        let result = await runScriptAsync("dotnet", ["new", "web", "-o", projectDir, "--force"]);
        if (result !== 0) {
          console.log(
            pc.bold(
              "Dotnet version 9 cli is required for scaffolding.  Download here: https://dotnet.microsoft.com/download ",
            ),
          );
          return;
        }
        if (useSwagger) {
          console.log(pc.bold("Adding OpenApi generation support"));
          console.log(pc.green(`> dotnet add ${projectDir} package SwashBuckle.AspNetCore`));
          result = await runScriptAsync("dotnet", [
            "add",
            projectDir,
            "package",
            "SwashBuckle.AspNetCore",
          ]);
        }
        console.log(pc.bold("Compiling spec with mock implementations"));
        const generatedTargetDir = resolvePath(process.cwd(), projectDir, "generated");
        const generatedOpenApiDir = resolvePath(process.cwd(), projectDir, "openapi");
        const compileArgs: string[] = [
          "tsp",
          "compile",
          pathToSpec,
          "--emit",
          "@typespec/http-server-csharp",
          "--option",
          `@typespec/http-server-csharp.emitter-output-dir=${generatedTargetDir}`,
          "--option",
          "@typespec/http-server-csharp.emit-mocks=all",
        ];

        const swaggerArgs: string[] = [
          "--emit",
          "@typespec/openapi3",
          "--option",
          `@typespec/openapi3.emitter-output-dir=${generatedOpenApiDir}`,
          "--option",
          "@typespec/http-server-csharp.use-swaggerui=true",
        ];
        if (useSwagger) compileArgs.push(...swaggerArgs);
        result = await runScriptAsync("npx", compileArgs);
        if (result === 0) {
          console.log(pc.bold(`Your project was successfully created at "${projectDir}"`));
          console.log(
            `You can build and start the project using 'dotnet run --project ${projectDir}'`,
          );
        } else {
          console.log(pc.bold("There were one or more errors"));
          if (useSwagger) {
            console.log(
              "You must have @typespec/openapi3 as a dependency in your typespec project for use of SwaggerUI. ",
            );
          }
        }
      },
    )
    .version(typespecVersion)
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

function internalError(error: unknown) {
  // NOTE: An expected error, like one thrown for bad input, shouldn't reach
  // here, but be handled somewhere else. If we reach here, it should be
  // considered a bug and therefore we should not suppress the stack trace as
  // that risks losing it in the case of a bug that does not repro easily.
  console.log(error);
}

function runScriptAsync(cmd: string, args: string[]): Promise<number> {
  let resolver: (value: number | PromiseLike<number>) => void;
  let rejecter: (value: unknown) => void;
  const promise = new Promise<number>((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });
  console.log(pc.green(`> ${cmd} ${args.join(" ")}`));
  const proc = spawn(cmd, args);
  proc.stdout?.on("data", (data) => console.log(pc.dim(data)));
  proc.stderr?.on("data", (data) => {
    console.error(data);
    rejecter(data);
  });
  proc.on("close", (_, __) => {
    resolver(proc.exitCode || 0);
  });

  return promise;
}

process.on("unhandledRejection", (error: unknown) => {
  console.error("Unhandled promise rejection!");
  internalError(error);
});

main().catch(internalError);
