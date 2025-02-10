#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { compile, formatDiagnostic, NodeHost, OperationContainer } from "@typespec/compiler";

import YAML from "yaml";

import { getHttpService, HttpOperation, HttpService } from "@typespec/http";
import { spawn as _spawn, SpawnOptions } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createOrGetModuleForNamespace } from "../../common/namespace.js";
import {
  createInitialContext,
  createModule,
  createPathCursor,
  isModule,
  JsContext,
  Module,
} from "../../ctx.js";
import { parseCase } from "../../util/case.js";

import { module as httpHelperModule } from "../../../generated-defs/helpers/http.js";
import { module as routerModule } from "../../../generated-defs/helpers/router.js";
import { emitOptionsType } from "../../common/interface.js";
import { emitTypeReference, isValueLiteralType } from "../../common/reference.js";
import { getAllProperties } from "../../util/extends.js";
import { bifilter, indent } from "../../util/iter.js";
import { createOnceQueue } from "../../util/once-queue.js";
import { writeModuleFile } from "../../write.js";

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

const DEFAULT_TSCONFIG = {
  compilerOptions: {
    target: "es2020",
    module: "Node16",
    moduleResolution: "node16",
    outDir: "./dist/",
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    strict: true,
    skipLibCheck: true,
    declaration: true,
    sourceMap: true,
  },
  include: ["src/**/*.ts", "tsp-output/@typespec/http-server-javascript/**/*.ts"],
};

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

export async function scaffold() {
  const paths = Object.fromEntries(
    Object.entries(COMMON_PATHS).map(([key, value]) => [key, path.resolve(value)]),
  ) as typeof COMMON_PATHS;

  const cwd = process.cwd();

  console.info("[hsj] Scaffolding TypeScript project...");
  console.info(
    `[hsj] Using project file '${path.relative(cwd, paths.projectYaml)}' and main file '${path.relative(cwd, paths.mainTsp)}'`,
  );

  let config: any;

  try {
    const configText = await fs.readFile(paths.projectYaml);

    config = YAML.parse(configText.toString("utf-8"));
  } catch {
    console.error(
      "[hsj] Failed to read project configuration file. Is the project initialized using `tsp init`?",
    );
    process.exit(1);
  }

  const isExpress = !!config.options?.["@typespec/http-server-javascript"]?.express;
  console.info(
    `[hsj] Emitter options have 'express: ${isExpress}'. Generating server model: '${isExpress ? "Express" : "Node"}'.`,
  );

  console.info("[hsj] Compiling TypeSpec project...");

  const program = await compile(NodeHost, COMMON_PATHS.mainTsp, {
    noEmit: true,
    config: paths.projectYaml,
    emit: [],
  });

  const jsCtx = await createInitialContext(program, {
    express: isExpress,
    "no-format": false,
    "omit-unreachable-types": true,
  });

  if (!jsCtx) {
    console.error("[hsj] No services were found in the program. Exiting.");
    process.exit(1);
  }

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

  const srcModule: Module = {
    name: "src",
    cursor: createPathCursor("src"),
    declarations: [],
    imports: [],
  };

  const routeControllers = await createRouteControllers(jsCtx, httpService, srcModule);

  console.info("[hsj] Generating server entry point...");

  const controllerModules = new Set<Module>();

  for (const { name, module } of routeControllers) {
    controllerModules.add(module);
    srcModule.imports.push({ binder: [name], from: module });
  }

  const routerName = parseCase(httpService.namespace.name).pascalCase + "Router";

  srcModule.imports.push({
    binder: ["create" + routerName],
    from: "../tsp-output/@typespec/http-server-javascript/http/router.js",
  });

  srcModule.declarations.push([
    `const router = create${routerName}(`,
    ...routeControllers.map((controller) => `  new ${controller.name}(),`),
    `);`,
    "",
    "const PORT = process.env.PORT || 3000;",
  ]);

  if (isExpress) {
    srcModule.imports.push({
      binder: "express",
      from: "express",
    });

    srcModule.declarations.push([
      "const app = express();",
      "",
      "app.use(router.expressMiddleware);",
      "",
      "app.listen(PORT, () => {",
      `  console.log(\`Server is running at http://localhost:\${PORT}\`);`,
      "});",
    ]);
  } else {
    srcModule.imports.push({
      binder: ["createServer"],
      from: "node:http",
    });

    srcModule.declarations.push([
      "const server = createServer(router.dispatch);",
      "",
      "server.listen(PORT, () => {",
      `  console.log(\`Server is running at http://localhost:\${PORT}\`);`,
      "});",
    ]);
  }

  console.info("[hsj] Writing files...");

  const queue = createOnceQueue<Module>();

  await writeModuleFile(jsCtx, cwd, srcModule, queue, /* format */ true, tryWrite);

  for (const module of controllerModules) {
    module.imports = module.imports.map((_import) => {
      if (typeof _import.from !== "string" && !controllerModules.has(_import.from)) {
        const backout = module.cursor.path.map(() => "..").slice(1);

        const [declaredModules] = bifilter(_import.from.declarations, isModule);

        const targetIsIndex = _import.from.cursor.path.length === 0 || declaredModules.length > 0;

        const modulePrincipalName = _import.from.cursor.path.slice(-1)[0];

        const targetPath = [
          ...backout,
          "tsp-output",
          "@typespec",
          "http-server-javascript",
          ..._import.from.cursor.path.slice(0, -1),
          ...(targetIsIndex ? [modulePrincipalName, "index.js"] : [`${modulePrincipalName}.js`]),
        ].join("/");

        _import.from = targetPath;
      }

      return _import;
    });

    await writeModuleFile(jsCtx, cwd, module, queue, /* format */ true, tryWrite);
  }

  // Force writing of http helper module
  await writeModuleFile(
    jsCtx,
    path.join(cwd, "tsp-output", "@typespec", "http-server-javascript"),
    httpHelperModule,
    queue,
    /* format */ true,
    tryWrite,
  );

  await tryWrite(paths.tsConfigJson, JSON.stringify(DEFAULT_TSCONFIG, null, 2) + "\n");
  await tryWrite(paths.vsCodeLaunchJson, JSON.stringify(VSCODE_LAUNCH_JSON, null, 2) + "\n");
  await tryWrite(paths.vsCodeTasksJson, JSON.stringify(VSCODE_TASKS_JSON, null, 2) + "\n");

  console.info("[hsj] Checking package.json for changes...");

  const packageJson = JSON.parse((await fs.readFile(paths.packageJson)).toString("utf-8"));

  const packageJsonChanged = updatePackageJson(packageJson, isExpress);

  if (packageJsonChanged) {
    console.info("[hsj] Writing updated package.json...");

    try {
      await fs.writeFile(paths.packageJson, JSON.stringify(packageJson, null, 2) + "\n");
    } catch {
      console.error("[hsj] Failed to write package.json.");
      process.exit(1);
    }

    // Run npm install to ensure dependencies are installed.
    console.info("[hsj] Running npm install...");

    try {
      await spawn("npm", ["install"], { stdio: "inherit" });
    } catch {
      console.warn(
        "[hsj] Failed to run npm install. Check the output above for errors and install dependencies manually.",
      );
    }
  } else {
    console.info("[hsj] No changes to package.json suggested.");
  }

  console.info("[hsj] Project scaffolding complete. Building project...");

  try {
    await spawn("npm", ["run", "build"], { stdio: "inherit" });
  } catch {
    console.error("[hsj] Failed to build project. Check the output above for errors.");
    process.exit(1);
  }

  console.info("[hsj] Project is ready to run. Use `npm start` to launch the server.");
  console.info("[hsj] A debug configuration has been created for Visual Studio Code.");
  console.info("[hsj] Try `code .` to open the project and press F5 to start debugging.");
  console.info(
    "[hsj] The newly-generated route controllers in 'src/controllers' are ready to be implemented.",
  );
  console.info("[hsj] Done.");

  async function tryWrite(file: string, contents: string): Promise<void> {
    try {
      const relative = path.relative(cwd, file);

      const exists = await fs
        .stat(file)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        console.warn(`[hsj] File '${relative}' already exists and will not be overwritten.`);
        console.warn(`[hsj] Manually update the file or delete it and run scaffolding again.`);

        return;
      }

      console.info(`[hsj] Writing file '${relative}'...`);

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
  module.imports.push({
    binder: ["NotImplementedError"],
    from: httpHelperModule,
  });
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

    yield "  throw new NotImplementedError();";
    yield "}";
    yield "";
  }
}

const JS_IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function updatePackageJson(packageJson: any, isExpress: boolean): boolean {
  let changed = false;

  updateObjectPath(["scripts", "start"], "node dist/src/index.js");
  updateObjectPath(["scripts", "build"], "npm run build:typespec && tsc");
  updateObjectPath(["scripts", "build:typespec"], "tsp compile .");
  updateObjectPath(["scripts", "build:scaffold"], "hsj-scaffold");

  updateObjectPath(["devDependencies", "typescript"], "^5.7.3");
  updateObjectPath(["devDependencies", "@types/node"], "^22.13.1");

  if (isExpress) {
    updateObjectPath(["dependencies", "express"], "^4.21.2");
    updateObjectPath(["devDependencies", "@types/express"], "^4.17.21");
  }

  return changed;

  function updateObjectPath(path: string[], value: string): boolean {
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

    if (!existingValue) {
      console.info(`[hsj] - Setting package.json property '${property}' to "${value}".`);

      current[path[path.length - 1]] = value;

      changed ||= true;

      return true;
    }

    if (current[path[path.length - 1]] !== value) {
      console.info(`[hsj] - Skipping package.json property '${property}'.`);
      console.info(
        `[hsj]   Scaffolding prefers "${value}", but it is already set to "${existingValue}".`,
      );
      console.info(
        "[hsj]   Manually update the property or remove it and run scaffolding again if needed.",
      );
    }

    return false;
  }
}

scaffold().catch((error) => {
  console.error(error);
  process.exit(1);
});
