#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { compile, formatDiagnostic, NodeHost, OperationContainer } from "@typespec/compiler";

import YAML from "yaml";

import { getHttpService, HttpOperation, HttpService } from "@typespec/http";
import { spawn as _spawn, SpawnOptions } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { createOrGetModuleForNamespace } from "../../common/namespace.js";
import { createInitialContext, createModule, isModule, JsContext, Module } from "../../ctx.js";
import { parseCase } from "../../util/case.js";

import { SupportedOpenAPIDocuments } from "@typespec/openapi3";
import { module as httpHelperModule } from "../../../generated-defs/helpers/http.js";
import { module as routerModule } from "../../../generated-defs/helpers/router.js";
import { emitOptionsType } from "../../common/interface.js";
import { emitTypeReference, isValueLiteralType } from "../../common/reference.js";
import { getAllProperties } from "../../util/extends.js";
import { bifilter, indent } from "../../util/iter.js";
import { createOnceQueue } from "../../util/once-queue.js";
import { tryGetOpenApi3 } from "../../util/openapi3.js";
import { writeModuleFile } from "../../write.js";
import { mockType } from "./data-mocks.js";

function spawn(command: string, args: string[], options: SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = _spawn(command, args, options);

    proc.on("error", reject);
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
  });
}

/* eslint-disable no-console */

const COMMON_PATHS = {
  mainTsp: "./main.tsp",
  projectYaml: "./tspconfig.yaml",
  packageJson: "./package.json",
  tsConfigJson: "./tsconfig.json",
  vsCodeLaunchJson: "./.vscode/launch.json",
  vsCodeTasksJson: "./.vscode/tasks.json",
} as const;

function getDefaultTsConfig(standalone: boolean) {
  return {
    compilerOptions: {
      target: "es2020",
      module: "Node16",
      moduleResolution: "node16",
      rootDir: "./",
      outDir: "./dist/",
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      skipLibCheck: true,
      declaration: true,
      sourceMap: true,
    },
    include: standalone
      ? ["src/**/*.ts"]
      : ["src/**/*.ts", "tsp-output/@typespec/http-server-js/**/*.ts"],
  } as const;
}

const VSCODE_LAUNCH_JSON = {
  configurations: [
    {
      type: "node",
      request: "launch",
      name: "Launch Program",
      program: "${workspaceFolder}/dist/src/index.js",
      preLaunchTask: "npm: build",
      internalConsoleOptions: "neverOpen",
    },
  ],
};

const VSCODE_TASKS_JSON = {
  version: "2.0.0",
  tasks: [
    {
      type: "npm",
      script: "build",
      group: "build",
      problemMatcher: [],
      label: "npm: build",
      presentation: {
        reveal: "silent",
      },
    },
  ],
};

interface ScaffoldingOptions {
  /**
   * If true, the project will be generated in the current directory instead of the output directory.
   */
  "no-standalone": boolean;
  /**
   * If true, writes will be forced even if the file or setting already exists. Use with caution.
   */
  force: boolean;
}

const DEFAULT_SCAFFOLDING_OPTIONS: ScaffoldingOptions = {
  "no-standalone": false,
  force: false,
};

function parseScaffoldArguments(args: string[]): ScaffoldingOptions {
  let cursor = 2;
  const options: Partial<ScaffoldingOptions> = {};

  while (cursor < args.length) {
    const arg = args[cursor];

    if (arg === "--no-standalone") {
      options["no-standalone"] = true;
    } else if (arg === "--force") {
      options.force = true;
    } else {
      console.error(`[hsj] Unrecognized scaffolding argument: '${arg}'`);
      process.exit(1);
    }

    cursor++;
  }

  return { ...DEFAULT_SCAFFOLDING_OPTIONS, ...options };
}

async function confirmYesNo(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const response = await rl.question(`${message} [y/N] `);

    if (response.trim().toLowerCase() !== "y") {
      console.error("[hsj] Operation cancelled.");
      process.exit(0);
    }
  } finally {
    rl.close();
  }
}

export async function scaffold(options: ScaffoldingOptions) {
  if (options.force) {
    await confirmYesNo(
      "[hsj] The `--force` flag is set and will overwrite existing files and settings that may have been modified. Continue?",
    );
  }

  const cwd = process.cwd();

  const projectYamlPath = path.resolve(cwd, COMMON_PATHS.projectYaml);
  const mainTspPath = path.resolve(cwd, COMMON_PATHS.mainTsp);

  console.info("[hsj] Scaffolding TypeScript project...");
  console.info(
    `[hsj] Using project file '${path.relative(cwd, projectYamlPath)}' and main file '${path.relative(cwd, mainTspPath)}'`,
  );

  let config: any;

  try {
    const configText = await fs.readFile(projectYamlPath);

    config = YAML.parse(configText.toString("utf-8"));
  } catch {
    console.error(
      "[hsj] Failed to read project configuration file. Is the project initialized using `tsp init`?",
    );
    process.exit(1);
  }

  // TODO: all of this path handling is awful. We need a good API from the compiler to interpolate the paths for us and
  // resolve the options from the config using the schema.

  const emitterOutputDirTemplate =
    config.options?.["@typespec/http-server-js"]?.["emitter-output-dir"];
  const defaultOutputDir = path.resolve(path.dirname(projectYamlPath), "tsp-output");

  const emitterOutputDir = emitterOutputDirTemplate.replace("{output-dir}", defaultOutputDir);

  const baseOutputDir = options["no-standalone"] ? cwd : path.resolve(cwd, emitterOutputDir);
  const tsConfigOutputPath = path.resolve(baseOutputDir, COMMON_PATHS.tsConfigJson);

  const expressOptions: PackageJsonExpressOptions = {
    isExpress: !!config.options?.["@typespec/http-server-js"]?.express,
    openApi3: undefined,
  };

  console.info(
    `[hsj] Emitter options have 'express: ${expressOptions.isExpress}'. Generating server model: '${expressOptions.isExpress ? "Express" : "Node"}'.`,
  );

  if (options["no-standalone"]) {
    console.info("[hsj] Standalone mode disabled, generating project in current directory.");
  } else {
    console.info("[hsj] Generating standalone project in output directory.");
  }

  console.info("[hsj] Compiling TypeSpec project...");

  const program = await compile(NodeHost, mainTspPath, {
    noEmit: true,
    config: projectYamlPath,
    emit: [],
  });

  const jsCtx = await createInitialContext(program, {
    express: expressOptions.isExpress,
    "no-format": false,
    "omit-unreachable-types": true,
  });

  if (!jsCtx) {
    console.error("[hsj] No services were found in the program. Exiting.");
    process.exit(1);
  }

  expressOptions.openApi3 = await tryGetOpenApi3(program, jsCtx.service);

  const [httpService, httpDiagnostics] = getHttpService(program, jsCtx.service.type);

  let hadError = false;

  for (const diagnostic of [...program.diagnostics, ...httpDiagnostics]) {
    hadError = hadError || diagnostic.severity === "error";
    console.error(formatDiagnostic(diagnostic, { pathRelativeTo: cwd, pretty: true }));
  }

  if (program.hasError() || hadError) {
    console.error("[hsj] TypeScript compilation failed. See above error output.");
    process.exit(1);
  }

  console.info("[hsj] TypeSpec compiled successfully. Scaffolding implementation...");

  const indexModule = jsCtx.srcModule;

  const routeControllers = await createRouteControllers(jsCtx, httpService, indexModule);

  console.info("[hsj] Generating server entry point...");

  const controllerModules = new Set<Module>();

  for (const { name, module } of routeControllers) {
    controllerModules.add(module);
    indexModule.imports.push({ binder: [name], from: module });
  }

  const routerName = parseCase(httpService.namespace.name).pascalCase + "Router";

  indexModule.imports.push({
    binder: ["create" + routerName],
    from: options["no-standalone"]
      ? "../tsp-output/@typespec/http-server-js/src/generated/http/router.js"
      : "./generated/http/router.js",
  });

  indexModule.declarations.push([
    `const router = create${routerName}(`,
    ...routeControllers.map((controller) => `  new ${controller.name}(),`),
    `);`,
    "",
    "const PORT = process.env.PORT || 3000;",
  ]);

  if (expressOptions.isExpress) {
    indexModule.imports.push(
      {
        binder: "express",
        from: "express",
      },
      {
        binder: "morgan",
        from: "morgan",
      },
    );

    if (expressOptions.openApi3) {
      const swaggerUiModule = createModule("swagger-ui", indexModule);

      indexModule.imports.push({
        from: swaggerUiModule,
        binder: ["addSwaggerUi"],
      });

      swaggerUiModule.imports.push(
        {
          binder: "swaggerUi",
          from: "swagger-ui-express",
        },
        {
          binder: ["openApiDocument"],
          from: "./generated/http/openapi3.js",
        },
        {
          binder: "type express",
          from: "express",
        },
      );

      swaggerUiModule.declarations.push([
        "export function addSwaggerUi(path: string, app: express.Application) {",
        "  app.use(path, swaggerUi.serve, swaggerUi.setup(openApiDocument));",
        "}",
      ]);

      writeModuleFile(
        jsCtx,
        baseOutputDir,
        swaggerUiModule,
        createOnceQueue<Module>(),
        true,
        tryWrite,
      );
    }

    indexModule.declarations.push([
      "const app = express();",
      "",
      "app.use(morgan('dev'));",
      ...(expressOptions.openApi3
        ? [
            "",
            'const SWAGGER_UI_PATH = process.env.SWAGGER_UI_PATH || "/.api-docs";',
            "",
            "addSwaggerUi(SWAGGER_UI_PATH, app);",
          ]
        : []),
      "",
      "app.use(router.expressMiddleware);",
      "",
      "app.listen(PORT, () => {",
      `  console.log(\`Server is running at http://localhost:\${PORT}\`);`,
      ...(expressOptions.openApi3
        ? [
            "  console.log(`API documentation is available at http://localhost:${PORT}${SWAGGER_UI_PATH}`);",
          ]
        : []),
      "});",
    ]);
  } else {
    indexModule.imports.push({
      binder: ["createServer"],
      from: "node:http",
    });

    indexModule.declarations.push([
      "const server = createServer(router.dispatch);",
      "",
      "server.listen(PORT, () => {",
      `  console.log(\`Server is running at http://localhost:\${PORT}\`);`,
      "});",
    ]);
  }

  console.info("[hsj] Writing files...");

  const queue = createOnceQueue<Module>();

  await writeModuleFile(jsCtx, baseOutputDir, indexModule, queue, /* format */ true, tryWrite);

  for (const module of controllerModules) {
    module.imports = module.imports.map((_import) => {
      if (
        options["no-standalone"] &&
        typeof _import.from !== "string" &&
        !controllerModules.has(_import.from)
      ) {
        const backout = module.cursor.path.map(() => "..");

        const [declaredModules] = bifilter(_import.from.declarations, isModule);

        const targetIsIndex = _import.from.cursor.path.length === 0 || declaredModules.length > 0;

        const modulePrincipalName = _import.from.cursor.path.slice(-1)[0];

        const targetPath = [
          ...backout.slice(1),
          "tsp-output",
          "@typespec",
          "http-server-js",
          ..._import.from.cursor.path.slice(0, -1),
          ...(targetIsIndex ? [modulePrincipalName, "index.js"] : [`${modulePrincipalName}.js`]),
        ].join("/");

        _import.from = targetPath;
      }

      return _import;
    });

    await writeModuleFile(jsCtx, baseOutputDir, module, queue, /* format */ true, tryWrite);
  }

  // Force writing of http helper module
  await writeModuleFile(jsCtx, baseOutputDir, httpHelperModule, queue, /* format */ true, tryWrite);

  await tryWrite(
    tsConfigOutputPath,
    JSON.stringify(getDefaultTsConfig(!options["no-standalone"]), null, 2) + "\n",
  );

  const vsCodeLaunchJsonPath = path.resolve(baseOutputDir, COMMON_PATHS.vsCodeLaunchJson);
  const vsCodeTasksJsonPath = path.resolve(baseOutputDir, COMMON_PATHS.vsCodeTasksJson);

  await tryWrite(vsCodeLaunchJsonPath, JSON.stringify(VSCODE_LAUNCH_JSON, null, 2) + "\n");
  await tryWrite(vsCodeTasksJsonPath, JSON.stringify(VSCODE_TASKS_JSON, null, 2) + "\n");

  const ownPackageJsonPath = path.resolve(cwd, COMMON_PATHS.packageJson);

  let ownPackageJson;

  try {
    ownPackageJson = JSON.parse((await fs.readFile(ownPackageJsonPath)).toString("utf-8"));
  } catch {
    console.error("[hsj] Failed to read package.json of TypeSpec project. Exiting.");
    process.exit(1);
  }

  let packageJsonChanged = true;

  if (options["no-standalone"]) {
    console.info("[hsj] Checking package.json for changes...");

    packageJsonChanged = updatePackageJson(ownPackageJson, expressOptions, options.force);

    if (packageJsonChanged) {
      console.info("[hsj] Writing updated package.json...");

      try {
        await fs.writeFile(ownPackageJsonPath, JSON.stringify(ownPackageJson, null, 2) + "\n");
      } catch {
        console.error("[hsj] Failed to write package.json.");
        process.exit(1);
      }
    } else {
      console.info("[hsj] No changes to package.json suggested.");
    }
  } else {
    // Standalone mode, need to generate package.json from scratch
    const relativePathToSpec = path.relative(baseOutputDir, cwd);
    const packageJson = getPackageJsonForStandaloneProject(
      ownPackageJson,
      expressOptions,
      relativePathToSpec,
    );

    const packageJsonPath = path.resolve(baseOutputDir, COMMON_PATHS.packageJson);

    await tryWrite(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  }

  if (packageJsonChanged) {
    // Run npm install to ensure dependencies are installed.
    console.info("[hsj] Running npm install...");

    try {
      await spawn("npm", ["install"], {
        stdio: "inherit",
        cwd: options["no-standalone"] ? cwd : baseOutputDir,
        shell: process.platform === "win32",
      });
    } catch {
      console.warn(
        "[hsj] Failed to run npm install. Check the output above for errors and install dependencies manually.",
      );
    }
  }

  console.info("[hsj] Project scaffolding complete. Building project...");

  try {
    await spawn("npm", ["run", "build"], {
      stdio: "inherit",
      cwd: options["no-standalone"] ? cwd : baseOutputDir,
      shell: process.platform === "win32",
    });
  } catch {
    console.error("[hsj] Failed to build project. Check the output above for errors.");
    process.exit(1);
  }

  const codeDirectory = path.relative(cwd, options["no-standalone"] ? cwd : baseOutputDir);

  console.info("[hsj] Project is ready to run. Use `npm start` to launch the server.");
  console.info("[hsj] A debug configuration has been created for Visual Studio Code.");
  console.info(
    `[hsj] Try \`code ${codeDirectory}\` to open the project and press F5 to start debugging.`,
  );
  console.info(
    `[hsj] The newly-generated route controllers in '${path.join(codeDirectory, "src", "controllers")}' are ready to be implemented.`,
  );
  console.info("[hsj] Done.");

  async function tryWrite(file: string, contents: string): Promise<void> {
    try {
      const relative = path.relative(cwd, file);

      const exists = await fs
        .stat(file)
        .then(() => true)
        .catch(() => false);

      if (exists && !options.force) {
        console.warn(`[hsj] File '${relative}' already exists and will not be overwritten.`);
        console.warn(`[hsj] Manually update the file or delete it and run scaffolding again.`);

        return;
      } else if (exists) {
        console.warn(`[hsj] Overwriting file '${relative}'...`);
      } else {
        console.info(`[hsj] Writing file '${relative}'...`);
      }

      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, contents);
    } catch (e: unknown) {
      console.error(`[hsj] Failed to write file: '${(e as Error).message}'`);
    }
  }
}

interface RouteController {
  name: string;
  module: Module;
}

async function createRouteControllers(
  ctx: JsContext,
  httpService: HttpService,
  srcModule: Module,
): Promise<RouteController[]> {
  const controllers: RouteController[] = [];

  const operationsByContainer = new Map<OperationContainer, Set<HttpOperation>>();

  for (const operation of httpService.operations) {
    let byContainer = operationsByContainer.get(operation.container);

    if (!byContainer) {
      byContainer = new Set();
      operationsByContainer.set(operation.container, byContainer);
    }

    byContainer.add(operation);
  }

  const controllersModule = createModule("controllers", srcModule);

  for (const [container, operations] of operationsByContainer) {
    controllers.push(await createRouteController(ctx, container, operations, controllersModule));
  }

  return controllers;
}

async function createRouteController(
  ctx: JsContext,
  container: OperationContainer,
  operations: Set<HttpOperation>,
  controllersModule: Module,
): Promise<RouteController> {
  const nameCase = parseCase(container.name);
  const module = createModule(nameCase.kebabCase, controllersModule);

  const containerNameCase = parseCase(container.name);

  module.imports.push(
    {
      binder: [containerNameCase.pascalCase],
      from: createOrGetModuleForNamespace(ctx, container.namespace!),
    },
    {
      binder: ["HttpContext"],
      from: routerModule,
    },
  );

  const controllerName = containerNameCase.pascalCase + "Impl";

  console.info(`[hsj] Generating controller '${controllerName}'...`);

  module.declarations.push([
    `export class ${controllerName} implements ${containerNameCase.pascalCase}<HttpContext> {`,
    ...indent(emitControllerOperationHandlers(ctx, container, operations, module)),
    `}`,
  ]);

  return { name: controllerName, module };
}

function* emitControllerOperationHandlers(
  ctx: JsContext,
  container: OperationContainer,
  httpOperations: Set<HttpOperation>,
  module: Module,
): Iterable<string> {
  let importNotImplementedError = false;
  for (const httpOperation of httpOperations) {
    // TODO: unify construction of signature with emitOperation in common/interface.ts
    const op = httpOperation.operation;

    const opNameCase = parseCase(op.name);

    const opName = opNameCase.camelCase;

    const allParameters = getAllProperties(op.parameters);

    const hasOptions = allParameters.some((p) => p.optional);

    const returnTypeReference = emitTypeReference(ctx, op.returnType, op, module, {
      altName: opNameCase.pascalCase + "Result",
    });

    const returnType = `Promise<${returnTypeReference}>`;

    const params: string[] = [];

    for (const param of allParameters) {
      // If the type is a value literal, then we consider it a _setting_ and not a parameter.
      // This allows us to exclude metadata parameters (such as contentType) from the generated interface.
      if (param.optional || isValueLiteralType(param.type)) continue;

      const paramNameCase = parseCase(param.name);
      const paramName = paramNameCase.camelCase;

      const outputTypeReference = emitTypeReference(ctx, param.type, param, module, {
        altName: opNameCase.pascalCase + paramNameCase.pascalCase,
      });

      params.push(`${paramName}: ${outputTypeReference}`);
    }

    const paramsDeclarationLine = params.join(", ");

    if (hasOptions) {
      const optionsTypeName = opNameCase.pascalCase + "Options";

      emitOptionsType(ctx, op, module, optionsTypeName);

      const paramsFragment = params.length > 0 ? `${paramsDeclarationLine}, ` : "";

      // prettier-ignore
      yield `async ${opName}(ctx: HttpContext, ${paramsFragment}options?: ${optionsTypeName}): ${returnType} {`;
    } else {
      // prettier-ignore
      yield `async ${opName}(ctx: HttpContext, ${paramsDeclarationLine}): ${returnType} {`;
    }

    const mockReturn = mockType(op.returnType);

    if (mockReturn === undefined) {
      importNotImplementedError = true;
      yield "  throw new NotImplementedError();";
    } else if (mockReturn === "void") {
      yield "  return;";
    } else {
      yield `  return ${mockReturn};`;
    }
    yield "}";
    yield "";
  }

  if (importNotImplementedError) {
    module.imports.push({
      binder: ["NotImplementedError"],
      from: httpHelperModule,
    });
  }
}

function getPackageJsonForStandaloneProject(
  ownPackageJson: any,
  express: PackageJsonExpressOptions,
  relativePathToSpec: string,
): any {
  const packageJson = {
    name: (ownPackageJson.name ?? path.basename(process.cwd())) + "-server",
    version: ownPackageJson.version ?? "0.1.0",
    type: "module",
    description: "Generated TypeSpec server project.",
  } as any;

  if (ownPackageJson.private) {
    packageJson.private = true;
  }

  updatePackageJson(packageJson, express, true, () => {});

  delete packageJson.scripts["build:scaffold"];
  packageJson.scripts["build:typespec"] = 'tsp compile --output-dir=".." ' + relativePathToSpec;

  return packageJson;
}

const JS_IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

interface PackageJsonExpressOptions {
  isExpress: boolean;
  openApi3: SupportedOpenAPIDocuments | undefined;
}

function updatePackageJson(
  packageJson: any,
  express: PackageJsonExpressOptions,
  force: boolean,
  info: (...args: any[]) => void = console.info,
): boolean {
  let changed = false;

  updateObjectPath(["scripts", "start"], "node dist/src/index.js");
  updateObjectPath(["scripts", "build"], "npm run build:typespec && tsc");
  updateObjectPath(["scripts", "build:typespec"], "tsp compile .");
  updateObjectPath(["scripts", "build:scaffold"], "hsjs-scaffold");

  updateObjectPath(["devDependencies", "typescript"], "^5.7.3");
  updateObjectPath(["devDependencies", "@types/node"], "^22.13.1");

  if (express.isExpress) {
    updateObjectPath(["dependencies", "express"], "^5.0.1");
    updateObjectPath(["devDependencies", "@types/express"], "^5.0.0");

    if (express.openApi3) {
      updateObjectPath(["dependencies", "swagger-ui-express"], "^5.0.1");
      updateObjectPath(["devDependencies", "@types/swagger-ui-express"], "^4.1.7");
    }

    updateObjectPath(["dependencies", "morgan"], "^1.10.0");
    updateObjectPath(["devDependencies", "@types/morgan"], "^1.9.9");
  }

  return changed;

  function updateObjectPath(path: string[], value: string) {
    let current = packageJson;

    for (const fragment of path.slice(0, -1)) {
      current = current[fragment] ??= {};
    }

    const existingValue = current[path[path.length - 1]];

    let property = "";

    for (const fragment of path) {
      if (!JS_IDENTIFIER_RE.test(fragment)) {
        property += `["${fragment}"]`;
      } else {
        property += property === "" ? fragment : `.${fragment}`;
      }
    }

    if (!existingValue || force) {
      if (!existingValue) {
        info(`[hsj] - Setting package.json property '${property}' to "${value}".`);
      } else if (force) {
        info(`[hsj] - Overwriting package.json property '${property}' to "${value}".`);
      }

      current[path[path.length - 1]] = value;

      changed ||= true;

      return;
    }

    if (current[path[path.length - 1]] !== value) {
      info(`[hsj] - Skipping package.json property '${property}'.`);
      info(`[hsj]   Scaffolding prefers "${value}", but it is already set to "${existingValue}".`);
      info(
        "[hsj]   Manually update the property or remove it and run scaffolding again if needed.",
      );
    }
  }
}

scaffold(parseScaffoldArguments(process.argv)).catch((error) => {
  console.error(error);
  process.exit(1);
});
