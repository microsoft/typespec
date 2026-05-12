import {
  CompilerHost,
  Diagnostic,
  DiagnosticCollector,
  NoTarget,
  Program,
  createDiagnosticCollector,
  getAnyExtensionFromPath,
  getRelativePathFromDirectory,
  joinPaths,
  normalizePath,
  resolvePath,
} from "@typespec/compiler";
import {
  SdkArrayExampleValue,
  SdkArrayType,
  SdkClientType,
  SdkDictionaryExampleValue,
  SdkDictionaryType,
  SdkExampleValue,
  SdkHttpOperation,
  SdkHttpOperationExample,
  SdkHttpParameter,
  SdkHttpParameterExampleValue,
  SdkHttpResponse,
  SdkHttpResponseExampleValue,
  SdkModelExampleValue,
  SdkModelPropertyType,
  SdkModelType,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkType,
  TCGCContext,
  isSdkFloatKind,
  isSdkIntKind,
} from "./interfaces.js";
import { createDiagnostic } from "./lib.js";
import { resolveOperationId } from "./public-utils.js";

interface LoadedExample {
  readonly relativePath: string;
  readonly data: any;
}

async function checkExamplesDirExists(host: CompilerHost, dir: string) {
  try {
    return (await host.stat(dir)).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Load all examples for a client
 *
 * @param context
 * @returns a map of all operations' examples, key is operation's operation id,
 * value is a map of examples, key is example's title, value is example's details
 */
async function loadExamples(
  context: TCGCContext,
): Promise<[Map<string, Record<string, LoadedExample>>, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();

  const apiVersions = context.getPackageVersions();
  const exampleDirs: string[][] = [];
  if (apiVersions.size <= 1) {
    // single service case
    const apiVersion =
      apiVersions.size === 1 ? apiVersions.values().next().value?.at(-1) : undefined;
    const examplesBaseDir = resolvePath(
      context.program.projectRoot,
      context.examplesDir ?? "./examples",
    );
    const exampleDir = apiVersion
      ? resolvePath(examplesBaseDir, apiVersion)
      : resolvePath(examplesBaseDir);
    if (!(await checkExamplesDirExists(context.program.host, exampleDir))) {
      if (context.examplesDir) {
        diagnostics.add(
          createDiagnostic({
            code: "example-loading",
            messageId: "noDirectory",
            format: { directory: exampleDir },
            target: NoTarget,
          }),
        );
      }
      return diagnostics.wrap(new Map());
    }
    exampleDirs.push([exampleDir, examplesBaseDir]);
  } else {
    // multiple services case, we need to load examples from sub service folders
    for (const [service, versions] of apiVersions) {
      const apiVersion = versions.length > 0 ? versions[versions.length - 1] : undefined;
      const examplesBaseDir = resolvePath(
        context.program.projectRoot,
        service.name,
        context.examplesDir ?? "./examples",
      );
      const exampleDir = apiVersion
        ? resolvePath(examplesBaseDir, apiVersion)
        : resolvePath(examplesBaseDir);

      if (await checkExamplesDirExists(context.program.host, exampleDir)) {
        exampleDirs.push([exampleDir, examplesBaseDir]);
      }
    }
  }

  const map = new Map<string, Record<string, LoadedExample>>();
  for (const [exampleDir, examplesBaseDir] of exampleDirs) {
    const exampleFiles = await searchExampleJsonFiles(context.program, exampleDir);
    for (const fileName of exampleFiles) {
      try {
        const exampleFile = await context.program.host.readFile(resolvePath(exampleDir, fileName));
        const example = JSON.parse(exampleFile.text);
        if (!example.operationId || !example.title) {
          diagnostics.add(
            createDiagnostic({
              code: "example-loading",
              messageId: "noOperationId",
              format: { filename: fileName },
              target: NoTarget,
            }),
          );
          continue;
        }

        if (!map.has(example.operationId.toLowerCase())) {
          map.set(example.operationId.toLowerCase(), {});
        }
        const examples = map.get(example.operationId.toLowerCase())!;

        if (example.title in examples) {
          diagnostics.add(
            createDiagnostic({
              code: "duplicate-example-file",
              target: NoTarget,
              format: {
                filename: fileName,
                operationId: example.operationId,
                title: example.title,
              },
            }),
          );
        }

        examples[example.title] = {
          relativePath: getRelativePathFromDirectory(
            examplesBaseDir,
            resolvePath(exampleDir, fileName),
            false,
          ),
          data: example,
        };
      } catch (err) {
        diagnostics.add(
          createDiagnostic({
            code: "example-loading",
            messageId: "default",
            format: { filename: fileName, error: err?.toString() ?? "" },
            target: NoTarget,
          }),
        );
      }
    }
  }
  return diagnostics.wrap(map);
}

async function searchExampleJsonFiles(program: Program, exampleDir: string): Promise<string[]> {
  const host = program.host;
  const exampleFiles: string[] = [];

  // Recursive file search
  async function recursiveSearch(dir: string): Promise<void> {
    const fileItems = await host.readDir(dir);

    for (const item of fileItems) {
      const fullPath = joinPaths(dir, item);
      const relativePath = getRelativePathFromDirectory(exampleDir, fullPath, false);

      if ((await host.stat(fullPath)).isDirectory()) {
        await recursiveSearch(fullPath);
      } else if (
        (await host.stat(fullPath)).isFile() &&
        getAnyExtensionFromPath(item) === ".json"
      ) {
        exampleFiles.push(normalizePath(relativePath));
      }
    }
  }

  await recursiveSearch(exampleDir);
  return exampleFiles;
}

export async function handleClientExamples(
  context: TCGCContext,
  client: SdkClientType<SdkServiceOperation>,
): Promise<[void, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();

  const examples = diagnostics.pipe(await loadExamples(context));
  const clientQueue = [client];
  while (clientQueue.length > 0) {
    const client = clientQueue.pop()!;
    if (client.children) {
      clientQueue.push(...client.children);
    }
    for (const method of client.methods) {
      // since operation could have customization in client.tsp, we need to handle all the original operation
      let operation = method.__raw;
      while (operation) {
        // try operation id with renaming
        let operationId = resolveOperationId(context, operation, true).toLowerCase();
        if (examples.has(operationId)) {
          diagnostics.pipe(handleMethodExamples(context, method, examples.get(operationId)!));
          break;
        }
        // try operation id without renaming
        operationId = resolveOperationId(context, operation, false).toLowerCase();
        if (examples.has(operationId)) {
          diagnostics.pipe(handleMethodExamples(context, method, examples.get(operationId)!));
          break;
        }
        operation = operation.sourceOperation;
      }
    }
  }
  return diagnostics.wrap(undefined);
}

function handleMethodExamples<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  method: SdkServiceMethod<TServiceOperation>,
  examples: Record<string, LoadedExample>,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  if (method.operation.kind === "http") {
    diagnostics.pipe(handleHttpOperationExamples(method.operation, examples));
    if (method.operation.examples) {
      context.__httpOperationExamples.set(method.operation.__raw, method.operation.examples);
    }
  }

  return diagnostics.wrap(undefined);
}

function handleHttpOperationExamples(
  operation: SdkHttpOperation,
  examples: Record<string, LoadedExample>,
) {
  const diagnostics = createDiagnosticCollector();
  operation.examples = [];

  for (const [title, example] of Object.entries(examples)) {
    const operationExample: SdkHttpOperationExample = {
      kind: "http",
      name: title,
      doc: title,
      filePath: example.relativePath,
      parameters: diagnostics.pipe(
        handleHttpParameters(
          operation.bodyParam
            ? [...operation.parameters, operation.bodyParam]
            : operation.parameters,
          example.data,
          example.relativePath,
        ),
      ),
      responses: diagnostics.pipe(
        handleHttpResponses(operation.responses, example.data, example.relativePath),
      ),
      rawExample: example.data,
    };

    operation.examples.push(operationExample);
  }

  // sort examples by file path
  operation.examples.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));

  return diagnostics.wrap(undefined);
}

function handleHttpParameters(
  parameters: SdkHttpParameter[],
  example: any,
  relativePath: string,
): [SdkHttpParameterExampleValue[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parameterExamples: SdkHttpParameterExampleValue[] = [];
  if (
    "parameters" in example &&
    typeof example.parameters === "object" &&
    example.parameters !== null
  ) {
    for (const name of Object.keys(example.parameters)) {
      let parameter = parameters.find((p) => p.serializedName === name);
      // fallback to use client name for any body parameter
      if (!parameter) {
        parameter = parameters.find((p) => p.name === name && p.kind === "body");
      }
      // fallback to body in example for any body parameter
      if (!parameter && name === "body") {
        parameter = parameters.find((p) => p.kind === "body");
      }
      if (parameter) {
        const value = diagnostics.pipe(
          getSdkTypeExample(parameter.type, example.parameters[name], relativePath),
        );
        if (value) {
          parameterExamples.push({
            parameter,
            value,
          });
        }
      } else {
        addExampleValueNoMappingDignostic(
          diagnostics,
          { [name]: example.parameters[name] },
          relativePath,
        );
      }
    }
  }
  return diagnostics.wrap(parameterExamples);
}

function handleHttpResponses(
  responses: SdkHttpResponse[],
  example: any,
  relativePath: string,
): [SdkHttpResponseExampleValue[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseExamples: SdkHttpResponseExampleValue[] = [];
  if (
    "responses" in example &&
    typeof example.responses === "object" &&
    example.responses !== null
  ) {
    for (const code of Object.keys(example.responses)) {
      const statusCode = parseInt(code, 10);
      let found = false;
      for (const response of responses) {
        const responseCode = response.statusCodes;
        if (responseCode === statusCode) {
          responseExamples.push(
            diagnostics.pipe(
              handleHttpResponse(response, statusCode, example.responses[code], relativePath),
            ),
          );
          found = true;
          break;
        } else if (
          typeof responseCode === "object" &&
          responseCode !== null &&
          responseCode.start <= statusCode &&
          responseCode.end >= statusCode
        ) {
          responseExamples.push(
            diagnostics.pipe(
              handleHttpResponse(response, statusCode, example.responses[code], relativePath),
            ),
          );
          found = true;
          break;
        }
      }
      if (!found) {
        addExampleValueNoMappingDignostic(
          diagnostics,
          { [code]: example.responses[code] },
          relativePath,
        );
      }
    }
  }
  return diagnostics.wrap(responseExamples);
}

function handleHttpResponse(
  response: SdkHttpResponse,
  statusCode: number,
  example: any,
  relativePath: string,
): [SdkHttpResponseExampleValue, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseExample: SdkHttpResponseExampleValue = {
    response,
    statusCode,
    headers: [],
  };
  if (typeof example === "object" && example !== null) {
    for (const name of Object.keys(example)) {
      if (name === "description") {
        continue;
      } else if (name === "body") {
        if (response.type) {
          responseExample.bodyValue = diagnostics.pipe(
            getSdkTypeExample(response.type, example.body, relativePath),
          );
        } else {
          addExampleValueNoMappingDignostic(diagnostics, { body: example.body }, relativePath);
        }
      } else if (name === "headers") {
        for (const subName of Object.keys(example.headers)) {
          const header = response.headers.find((p) => p.serializedName === subName);
          if (header) {
            const value = diagnostics.pipe(
              getSdkTypeExample(header.type, example[name][subName], relativePath),
            );
            if (value) {
              responseExample.headers.push({
                header,
                value,
              });
            }
          } else {
            addExampleValueNoMappingDignostic(
              diagnostics,
              { [subName]: example[name][subName] },
              relativePath,
            );
          }
        }
      } else {
        addExampleValueNoMappingDignostic(diagnostics, { [name]: example[name] }, relativePath);
      }
    }
  }
  return diagnostics.wrap(responseExample);
}

function getSdkTypeExample(
  type: SdkType,
  example: any,
  relativePath: string,
): [SdkExampleValue | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  if (example === null && type.kind !== "nullable" && type.kind !== "unknown") {
    return diagnostics.wrap(undefined);
  }

  if (isSdkIntKind(type.kind) || isSdkFloatKind(type.kind)) {
    return getSdkBaseTypeExample("number", type as SdkType, example, relativePath);
  } else {
    switch (type.kind) {
      case "string":
      case "bytes":
        return getSdkBaseTypeExample("string", type, example, relativePath);
      case "boolean":
        return getSdkBaseTypeExample("boolean", type, example, relativePath);
      case "url":
      case "plainDate":
      case "plainTime":
        return getSdkBaseTypeExample("string", type, example, relativePath);
      case "nullable":
        if (example === null) {
          return diagnostics.wrap({
            kind: "null",
            type,
            value: null,
          });
        } else {
          return getSdkTypeExample(type.type, example, relativePath);
        }
      case "unknown":
        return diagnostics.wrap({
          kind: "unknown",
          type,
          value: example,
        });
      case "constant":
        if (example === type.value) {
          return getSdkBaseTypeExample(
            typeof type.value as "string" | "number" | "boolean",
            type,
            example,
            relativePath,
          );
        } else {
          addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
          return diagnostics.wrap(undefined);
        }
      case "enum":
        if (type.values.some((v) => v.value === example) || !type.isFixed) {
          return getSdkBaseTypeExample(
            typeof example as "string" | "number",
            type,
            example,
            relativePath,
          );
        } else {
          addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
          return diagnostics.wrap(undefined);
        }
      case "enumvalue":
        if (type.value === example) {
          return getSdkBaseTypeExample(
            typeof example as "string" | "number",
            type,
            example,
            relativePath,
          );
        } else {
          addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
          return diagnostics.wrap(undefined);
        }
      case "utcDateTime":
      case "offsetDateTime":
      case "duration":
        const inner = diagnostics.pipe(getSdkTypeExample(type.wireType, example, relativePath));
        if (inner) {
          inner.type = type;
        }
        return diagnostics.wrap(inner);
      case "union":
        return diagnostics.wrap({
          kind: "union",
          type,
          value: example,
        });
      case "array":
        return getSdkArrayExample(type, example, relativePath);
      case "dict":
        return getSdkDictionaryExample(type, example, relativePath);
      case "model":
        return getSdkModelExample(type, example, relativePath);
    }
  }
  return diagnostics.wrap(undefined);
}

/**
 * Attempts to convert a string value to a number.
 * Returns the converted number if valid, undefined otherwise.
 */
function tryConvertStringToNumber(value: string): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const num = Number(value.trim());
  if (isNaN(num) || !isFinite(num)) {
    return undefined;
  }

  return num;
}

/**
 * Attempts to convert a string value to a boolean.
 * Returns the converted boolean if valid, undefined otherwise.
 */
function tryConvertStringToBoolean(value: string): boolean | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const lowerValue = value.toLowerCase().trim();
  if (lowerValue === "true") {
    return true;
  } else if (lowerValue === "false") {
    return false;
  }

  return undefined;
}

function getSdkBaseTypeExample(
  kind: "string" | "number" | "boolean",
  type: SdkType,
  example: any,
  relativePath: string,
): [SdkExampleValue | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  // Direct type match - use as is
  if (typeof example === kind) {
    return diagnostics.wrap({
      kind,
      type,
      value: example,
    } as SdkExampleValue);
  }

  // Try string conversion for number and boolean types
  if (typeof example === "string") {
    if (kind === "number") {
      const convertedNumber = tryConvertStringToNumber(example);
      if (convertedNumber !== undefined) {
        return diagnostics.wrap({
          kind,
          type,
          value: convertedNumber,
        } as SdkExampleValue);
      }
    } else if (kind === "boolean") {
      const convertedBoolean = tryConvertStringToBoolean(example);
      if (convertedBoolean !== undefined) {
        return diagnostics.wrap({
          kind,
          type,
          value: convertedBoolean,
        } as SdkExampleValue);
      }
    }
  }

  // If no conversion was possible, add diagnostic
  addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
  return diagnostics.wrap(undefined);
}

function getSdkArrayExample(
  type: SdkArrayType,
  example: any,
  relativePath: string,
): [SdkArrayExampleValue | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (Array.isArray(example)) {
    const arrayExample: SdkExampleValue[] = [];
    for (const item of example) {
      const result = diagnostics.pipe(getSdkTypeExample(type.valueType, item, relativePath));
      if (result) {
        arrayExample.push(result);
      }
    }
    return diagnostics.wrap({
      kind: "array",
      type,
      value: arrayExample,
    });
  } else {
    addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
    return diagnostics.wrap(undefined);
  }
}

function getSdkDictionaryExample(
  type: SdkDictionaryType,
  example: any,
  relativePath: string,
): [SdkDictionaryExampleValue | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (typeof example === "object") {
    const dictionaryExample: Record<string, SdkExampleValue> = {};
    for (const key of Object.keys(example)) {
      const result = diagnostics.pipe(
        getSdkTypeExample(type.valueType, example[key], relativePath),
      );
      if (result) {
        dictionaryExample[key] = result;
      }
    }
    return diagnostics.wrap({
      kind: "dict",
      type,
      value: dictionaryExample,
    });
  } else {
    addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
    return diagnostics.wrap(undefined);
  }
}

function getSdkModelExample(
  type: SdkModelType,
  example: any,
  relativePath: string,
): [SdkModelExampleValue | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (typeof example === "object") {
    // handle discriminated model
    if (type.discriminatorProperty) {
      if (type.discriminatorProperty.name in example) {
        if (
          type.discriminatedSubtypes &&
          example[type.discriminatorProperty.name] in type.discriminatedSubtypes
        ) {
          // handle example type that is defined in discriminated subtypes
          // else, fallback to the base model, handle out of the discriminator if
          return getSdkModelExample(
            type.discriminatedSubtypes![example[type.discriminatorProperty.name]],
            example,
            relativePath,
          );
        }
      } else {
        addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
        return diagnostics.wrap(undefined);
      }
    }

    let additionalPropertiesType: SdkType | undefined;
    const additionalProperties: Record<string, any> = new Map();
    const additionalPropertiesExample: Record<string, SdkExampleValue> = {};

    const properties: Map<string, SdkModelPropertyType> = new Map();
    const propertiesExample: Record<string, SdkExampleValue> = {};

    // get all properties type and additional properties type if exist
    const modelQueue = [type];
    while (modelQueue.length > 0) {
      const model = modelQueue.pop()!;
      for (const property of model.properties) {
        // for query/path/cookie/header parameters, they should have been handled in parameters.
        if (
          property.kind === "property" &&
          property.serializationOptions.json?.name &&
          !properties.has(property.serializationOptions.json.name)
        ) {
          properties.set(property.serializationOptions.json.name, property);
        }
      }
      if (model.additionalProperties && additionalPropertiesType === undefined) {
        additionalPropertiesType = model.additionalProperties;
      }
      if (model.baseModel) {
        modelQueue.push(model.baseModel);
      }
    }

    for (const name of Object.keys(example)) {
      const property = properties.get(name);
      if (property) {
        const result = diagnostics.pipe(
          getSdkTypeExample(property.type, example[name], relativePath),
        );
        if (result) {
          propertiesExample[name] = result;
        }
      } else {
        additionalProperties[name] = example[name];
      }
    }

    // handle additional properties
    if (Object.keys(additionalProperties).length > 0) {
      if (additionalPropertiesType) {
        for (const [name, value] of Object.entries(additionalProperties)) {
          const result = diagnostics.pipe(
            getSdkTypeExample(additionalPropertiesType, value, relativePath),
          );
          if (result) {
            additionalPropertiesExample[name] = result;
          }
        }
      } else {
        addExampleValueNoMappingDignostic(diagnostics, additionalProperties, relativePath);
      }
    }

    return diagnostics.wrap({
      kind: "model",
      type,
      value: propertiesExample,
      additionalPropertiesValue:
        Object.keys(additionalPropertiesExample).length > 0
          ? additionalPropertiesExample
          : undefined,
    });
  } else {
    addExampleValueNoMappingDignostic(diagnostics, example, relativePath);
    return diagnostics.wrap(undefined);
  }
}

function addExampleValueNoMappingDignostic(
  diagnostics: DiagnosticCollector,
  value: any,
  relativePath: string,
) {
  diagnostics.add(
    createDiagnostic({
      code: "example-value-no-mapping",
      target: NoTarget,
      format: {
        value: JSON.stringify(value),
        relativePath,
      },
    }),
  );
}
