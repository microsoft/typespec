import type { Model, ModelProperty, Program } from "@typespec/compiler";
import {
  getCookieParamOptions,
  getHeaderFieldOptions,
  getPathOptions,
  getQueryOptions,
  isBody,
  isBodyRoot,
  isMultipartBodyProperty,
  isStatusCode,
} from "./decorators.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { getAllHttpServices } from "./operations.js";
import { isSharedRoute } from "./route.js";
import { HttpOperation, HttpService } from "./types.js";

export function $onValidate(program: Program) {
  // Pass along any diagnostics that might be returned from the HTTP library
  const [services, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
  validateSharedRouteConsistency(program, services);
  validateHttpFiles(program);
}

function validateHttpFiles(program: Program) {
  const httpFiles = [...program.stateSet(HttpStateKeys.file)];

  for (const model of httpFiles) {
    if (model.kind === "Model") {
      validateHttpFileModel(program, model);
    }
  }
}

function validateHttpFileModel(program: Program, model: Model) {
  for (const prop of model.properties.values()) {
    switch (prop.name) {
      case "contentType":
      case "contents": {
        // Check if these properties have any HTTP metadata and if so, report an error
        const annotations = {
          header: getHeaderFieldOptions(program, prop),
          cookie: getCookieParamOptions(program, prop),
          query: getQueryOptions(program, prop),
          path: getPathOptions(program, prop),
          body: isBody(program, prop),
          bodyRoot: isBodyRoot(program, prop),
          multipartBody: isMultipartBodyProperty(program, prop),
          statusCode: isStatusCode(program, prop),
        };

        reportDisallowed(prop, annotations);
        break;
      }
      case "filename": {
        const annotations = {
          body: isBody(program, prop),
          bodyRoot: isBodyRoot(program, prop),
          multipartBody: isMultipartBodyProperty(program, prop),
          statusCode: isStatusCode(program, prop),
          cookie: getCookieParamOptions(program, prop),
        };

        reportDisallowed(prop, annotations);
        break;
      }
      default:
        reportDiagnostic(program, {
          code: "http-file-extra-property",
          format: { propName: prop.name },
          target: prop,
        });
    }
  }
  for (const child of model.derivedModels) {
    validateHttpFileModel(program, child);
  }

  function reportDisallowed(target: ModelProperty, annotations: Record<string, unknown>) {
    const metadataEntries = Object.entries(annotations).filter((e) => !!e[1]);

    for (const [metadataType] of metadataEntries) {
      reportDiagnostic(program, {
        code: "http-file-disallowed-metadata",
        format: { propName: target.name, metadataType },
        target: target,
      });
    }
  }
}

function groupHttpOperations(
  operations: HttpOperation[],
): Map<string, Map<string, HttpOperation[]>> {
  const paths = new Map<string, Map<string, HttpOperation[]>>();

  for (const operation of operations) {
    const { verb, path } = operation;
    let pathOps = paths.get(path);
    if (pathOps === undefined) {
      pathOps = new Map<string, HttpOperation[]>();
      paths.set(path, pathOps);
    }
    const ops = pathOps.get(verb);
    if (ops === undefined) {
      pathOps.set(verb, [operation]);
    } else {
      ops.push(operation);
    }
  }
  return paths;
}

function validateSharedRouteConsistency(program: Program, services: HttpService[]) {
  for (const service of services) {
    const paths = groupHttpOperations(service.operations);
    for (const pathOps of paths.values()) {
      for (const ops of pathOps.values()) {
        let hasShared = false;
        let hasNonShared = false;
        for (const op of ops) {
          if (isSharedRoute(program, op.operation)) {
            hasShared = true;
          } else {
            hasNonShared = true;
          }
        }
        if (hasShared && hasNonShared) {
          for (const op of ops) {
            reportDiagnostic(program, {
              code: "shared-inconsistency",
              target: op.operation,
              format: { verb: op.verb, path: op.path },
            });
          }
        }
      }
    }
  }
}
