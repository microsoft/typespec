/* eslint-disable no-console */
import { resolvePath } from "@typespec/compiler";
import { spawn } from "cross-spawn";
import pc from "picocolors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getFreePort } from "../lib/utils.js";

async function main() {
  console.log(`TypeSpec Http Server Emitter for C-Sharp \n`);

  await yargs(hideBin(process.argv))
    .scriptName("hscs")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .command(
      "scaffold [options] <project-directory> <path-to-spec>",
      "Generate a complete project with mock implementation at the given project-directory for the given spec.  This requires dotnet 9: https://dotnet.microsoft.com/download.",
      (cmd) => {
        return cmd
          .option("use-swaggerui", {
            description:
              "Include generated OpenAPI and a SwaggerUI endpoint in the service project.  THIS OPTION REQUIRES '@typespec/openapi3' as a dependency of your typespec project.",
            type: "boolean",
            default: false,
          })
          .option("project-name", {
            description: "The name of the generated project.",
            type: "string",
            default: "ServiceProject",
          })
          .option("http-port", {
            description: "The http port for the generated project to use locally",
            type: "number",
          })
          .option("https-port", {
            description: "The https port for the generated service to listen on locally.",
            type: "number",
          })
          .option("overwrite", {
            description: "Overwrite existing mock implementations",
            type: "boolean",
            default: true,
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
        const overwrite: boolean = args["overwrite"];
        const projectName: string = args["project-name"];
        const httpPort: number = args["http-port"] || (await getFreePort(5000, 5999));
        const httpsPort: number = args["https-port"] || (await getFreePort(7000, 7999));
        console.log(pc.bold("Compiling spec to create project with mock implementations"));
        console.log(pc.bold(`using http port ${httpPort} and https port ${httpsPort}`));
        const generatedTargetDir = resolvePath(process.cwd(), projectDir, "generated");
        const generatedOpenApiDir = resolvePath(process.cwd(), projectDir, "openapi");
        const openApiPath = resolvePath(generatedOpenApiDir, "openapi.yaml");
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
          "--option",
          `@typespec/http-server-csharp.project-name=${projectName}`,
        ];
        if (overwrite) {
          compileArgs.push("--option", "@typespec/http-server-csharp.overwrite=true");
        }
        if (httpPort) {
          compileArgs.push("--option", `@typespec/http-server-csharp.http-port=${httpPort}`);
        }
        if (httpsPort) {
          compileArgs.push("--option", `@typespec/http-server-csharp.https-port=${httpsPort}`);
        }

        const swaggerArgs: string[] = [
          "--emit",
          "@typespec/openapi3",
          "--option",
          `@typespec/openapi3.emitter-output-dir=${generatedOpenApiDir}`,
          "--option",
          "@typespec/http-server-csharp.use-swaggerui=true",
          "--option",
          `@typespec/http-server-csharp.openapi-path=${openApiPath}`,
        ];
        if (useSwagger) compileArgs.push(...swaggerArgs);
        const result = await runScriptAsync("npx", compileArgs);
        if (result === 0) {
          console.log(pc.bold(`Your project was successfully created at "${projectDir}"`));
          console.log(
            `You can build and start the project using 'dotnet run --project "${projectDir}"'`,
          );
          if (useSwagger && overwrite) {
            console.log(
              `You can browse the swagger UI to test your service using 'start https://localhost:${httpsPort}/swagger/' `,
            );
          }
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
  const promise = new Promise<number>((resolve, _) => {
    resolver = resolve;
  });
  console.log(pc.green(`> ${cmd} ${args.join(" ")}`));
  const proc = spawn(cmd, args);
  proc.stdout?.on("data", (data) => console.log(pc.dim(data)));
  proc.stderr?.on("data", (data) => {
    console.log(pc.dim(data));
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
