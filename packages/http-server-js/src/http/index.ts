// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { NoTarget } from "@typespec/compiler";
import { HttpServer, HttpService, getHttpService, getServers } from "@typespec/http";
import { JsContext, Module, createModule } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { getOpenApi3Emitter, getOpenApi3ServiceRecord, tryGetOpenApi3 } from "../util/openapi3.js";
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

  const openapi3Emitter = await getOpenApi3Emitter();
  const openapi3 = await tryGetOpenApi3(ctx.program, ctx.service);

  if (openapi3) {
    const openApiDocumentModule = createModule("openapi3", httpModule);

    openApiDocumentModule.declarations.push([
      `export const openApiDocument = ${JSON.stringify(openapi3)}`,
    ]);
  } else if (openapi3Emitter) {
    const serviceRecord = await getOpenApi3ServiceRecord(ctx.program, ctx.service);

    reportDiagnostic(ctx.program, {
      code: "openapi3-document-not-generated",
      target: ctx.service.type,
      messageId: serviceRecord?.versioned ? "versioned" : "unable",
    });
  }

  const operationsModule = createModule("operations", httpModule);

  const serverRawModule = emitRawServer(httpContext, operationsModule);
  emitRouter(httpContext, httpService, serverRawModule);
}
