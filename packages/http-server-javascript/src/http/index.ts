// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { NoTarget } from "@typespec/compiler";
import { HttpServer, HttpService, getHttpService, getServers } from "@typespec/http";
import { JsContext, Module, createModule } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
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

  const httpModule = createModule("http", ctx.rootModule);

  const httpContext: HttpContext = {
    ...ctx,
    httpService,
    httpModule,
    servers,
  };

  const operationsModule = createModule("operations", httpModule);

  const serverRawModule = emitRawServer(httpContext, operationsModule);
  emitRouter(httpContext, httpService, serverRawModule);
}
