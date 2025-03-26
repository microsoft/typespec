import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";

interface BasicRouter {
  /**
   * Dispatches the request to the appropriate service based on the request path.
   *
   * This member function may be used directly as a handler for a Node HTTP server.
   *
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   */
  dispatch(request: IncomingMessage, response: ServerResponse): void;
}

export function startServer(router: BasicRouter, abortSignal: AbortSignal): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (abortSignal.aborted) {
      return reject(new Error("Server start cancelled"));
    }
    const server = createServer((req, res) => router.dispatch(req, res));
    const stop = () => {
      return new Promise<void>((r) => {
        server.close(() => r);
        server.closeAllConnections();
      });
    };
    abortSignal.addEventListener("abort", () => {
      stop().catch(() => {});
    });
    server.listen(function (this: Server) {
      const address = this.address();
      if (!address) {
        reject(new Error("Server address not available"));
        stop().catch(() => {});
        return;
      }

      resolve(typeof address === "string" ? address : `http://localhost:${address.port}`);
    });
    server.on("error", reject);
  });
}

/**
 * Meant to be used for the `onInternalError` handler in the router
 * in order to log any failed test assertions from within service handlers.
 * Purely informational as the test will fail regardless.
 * @param ctx The HttpContext from the http-server-js router
 */
function logAssertionErrors(ctx: any, error: Error): void {
  // eslint-disable-next-line no-console
  console.error(error);
  ctx.response.statusCode = 599;
  ctx.response.end();
}

export const testRouterOptions = {
  onInternalError: logAssertionErrors,
};
