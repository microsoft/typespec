// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { NoTarget } from "@typespec/compiler";
import { HttpServer, HttpService, getHttpService, getServers } from "@typespec/http";
import { JsContext, Module, createModule } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { getOpenApi3Emitter } from "../util/openapi3.js";
import { emitRawServer } from "./server/index.js";
import { emitRouter } from "./server/router.js";

/**
 * Additional context items used by the HTTP emitter.
 */
export interface HttpContext extends JsContext {
  /**
   * The HTTP-level representation of the service.
   */
  httpService: HttpService;
  /**
   * The root module for HTTP-specific code.
   */
  httpModule: Module;
  /**
   * The server definitions of the service (\@server decorator)
   */
  servers: HttpServer[];
}

/**
 * Emits bindings for the service to be carried over the HTTP protocol.
 */
export async function emitHttp(ctx: JsContext) {
  const [httpService, diagnostics] = getHttpService(ctx.program, ctx.service.type);

  const diagnosticsAreError = diagnostics.some((d) => d.severity === "error");

  if (diagnosticsAreError) {
    reportDiagnostic(ctx.program, {
      code: "http-emit-disabled",
      target: NoTarget,
      messageId: "default",
    });
    return;
  }

  const servers = getServers(ctx.program, ctx.service.type) ?? [];

  const httpModule = createModule("http", ctx.generatedModule);

  const httpContext: HttpContext = {
    ...ctx,
    httpService,
    httpModule,
    servers,
  };

  const openapi3 = await getOpenApi3Emitter();

  if (openapi3) {
    const serviceRecords = await openapi3.getOpenAPI3(ctx.program, {
      "include-x-typespec-name": "never",
      "omit-unreachable-types": true,
      "safeint-strategy": "int64",
    });

    const serviceRecord = serviceRecords.find((s) => s.service === ctx.service);

    if (serviceRecord && !serviceRecord.versioned) {
      const openApiDocumentModule = createModule("openapi3", httpModule);

      openApiDocumentModule.declarations.push([
        `export const openApiDocument = ${JSON.stringify(serviceRecord.document)}`,
      ]);
    } else {
      // Warning: service either wasn't returned or wasn't versioned. Warn that openAPI document was attempted but not generated.
      reportDiagnostic(ctx.program, {
        code: "openapi3-document-not-generated",
        target: ctx.service.type,
        messageId: serviceRecord ? "versioned" : "unable",
      });
    }
  }

  const operationsModule = createModule("operations", httpModule);

  const serverRawModule = emitRawServer(httpContext, operationsModule);
  emitRouter(httpContext, httpService, serverRawModule);
}
