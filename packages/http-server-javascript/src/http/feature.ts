import { JSONSchemaType, NoTarget } from "@typespec/compiler";
import { HttpServer, HttpService, getHttpService, getServers } from "@typespec/http";
import { JsContext, Module, createModule } from "../ctx.js";
import { JsEmitterFeature, registerFeature } from "../feature.js";
import { reportDiagnostic } from "../lib.js";
import { emitRawServer } from "./server/index.js";
import { emitRouter } from "./server/router.js";

// Declare the existence of the HTTP feature.
declare module "../feature.js" {
  export interface JsEmitterFeature {
    http: HttpOptions;
  }
}

export interface HttpOptions {
  express?: boolean;
}

/**
 * Additional context items used by the HTTP emitter.
 */
export interface HttpContext extends JsContext {
  /**
   * The HTTP-level representation of the service.
   */
  httpService: HttpService;
  /**
   * The options provided to the HTTP feature.
   */
  httpOptions: HttpOptions;
  /**
   * The root module for HTTP-specific code.
   */
  httpModule: Module;
  /**
   * The server definitions of the service (\@server decorator)
   */
  servers: HttpServer[];
}

const HttpOptionsSchema: JSONSchemaType<JsEmitterFeature["http"]> = {
  type: "object",
  properties: {
    express: { type: "boolean", nullable: true, default: false },
  },
  required: [],
  nullable: true,
};

// Register the HTTP feature.
registerFeature("http", HttpOptionsSchema, emitHttp);

/**
 * Emits bindings for the service to be carried over the HTTP protocol.
 */
async function emitHttp(ctx: JsContext, options: JsEmitterFeature["http"]) {
  const [httpService, diagnostics] = getHttpService(ctx.program, ctx.service.type);

  const diagnosticsAreError = diagnostics.some((d) => d.severity === "error");

  if (diagnosticsAreError) {
    // TODO/witemple: ensure that HTTP-layer diagnostics are reported when the user enables
    // the HTTP feature.
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
    httpOptions: options,
  };

  const operationsModule = createModule("operations", httpModule);

  const serverRawModule = emitRawServer(httpContext, operationsModule);
  emitRouter(httpContext, httpService, serverRawModule);
}
