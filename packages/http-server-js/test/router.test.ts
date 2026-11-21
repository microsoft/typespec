// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import type * as http from "node:http";
import { describe, expect, it } from "vitest";
import { createPolicyChain, type HttpContext, type Policy } from "../src/helpers/router.js";

function makeContext(url = "/"): HttpContext {
  return {
    request: { url } as http.IncomingMessage,
    response: {} as http.ServerResponse,
    errorHandlers: {
      onRequestNotFound: () => {},
      onInvalidRequest: () => {},
      onInternalError: () => {},
    },
  };
}

describe("createPolicyChain", () => {
  it("returns the output function directly when no policies are provided", () => {
    const out = async (_ctx: HttpContext) => {};

    expect(createPolicyChain("test", [], out)).toBe(out);
  });

  it("returns a Promise and awaits policies in order", async () => {
    const calls: string[] = [];
    const first: Policy = async (_ctx, next) => {
      calls.push("first:before");
      await next();
      calls.push("first:after");
    };
    const second: Policy = async (_ctx, next) => {
      calls.push("second:before");
      await next();
      calls.push("second:after");
    };
    const out = async (_ctx: HttpContext) => {
      calls.push("out");
    };
    const chain = createPolicyChain("test", [first, second], out);

    const result = chain(makeContext());
    expect(result).toBeInstanceOf(Promise);
    await result;
    expect(calls).toEqual(["first:before", "second:before", "out", "second:after", "first:after"]);
  });

  it("waits for next when a synchronous policy does not return its Promise", async () => {
    const calls: string[] = [];
    const policy: Policy = (_ctx, next) => {
      void next();
      calls.push("policy:return");
    };
    const out = async (_ctx: HttpContext) => {
      await Promise.resolve();
      calls.push("out");
    };
    const chain = createPolicyChain("test", [policy], out);

    await chain(makeContext());
    expect(calls).toEqual(["policy:return", "out"]);
  });

  it("propagates synchronous and asynchronous policy errors", async () => {
    const syncPolicy: Policy = () => {
      throw new Error("sync policy error");
    };
    const asyncPolicy: Policy = async () => {
      await Promise.resolve();
      throw new Error("async policy error");
    };
    const out = async (_ctx: HttpContext) => {};

    await expect(createPolicyChain("sync", [syncPolicy], out)(makeContext())).rejects.toThrow(
      "sync policy error",
    );
    await expect(createPolicyChain("async", [asyncPolicy], out)(makeContext())).rejects.toThrow(
      "async policy error",
    );
  });

  it("propagates errors from the output function", async () => {
    const policy: Policy = (_ctx, next) => next();
    const out = async (_ctx: HttpContext) => {
      throw new Error("output error");
    };

    await expect(createPolicyChain("test", [policy], out)(makeContext())).rejects.toThrow(
      "output error",
    );
  });

  it("passes a replacement request to the rest of the chain", async () => {
    const replacement = { url: "/replacement" } as http.IncomingMessage;
    const policy: Policy = (_ctx, next) => next(replacement);
    let receivedRequest: http.IncomingMessage | undefined;
    const out = async (ctx: HttpContext) => {
      receivedRequest = ctx.request;
    };

    await createPolicyChain("test", [policy], out)(makeContext());
    expect(receivedRequest).toBe(replacement);
  });

  it("keeps output parameters isolated between concurrent requests", async () => {
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const policy: Policy = async (ctx, next) => {
      if (ctx.request.url === "/first") {
        await firstGate;
      }
      await next();
    };
    const received: string[] = [];
    const out = async (_ctx: HttpContext, value: string) => {
      received.push(value);
    };
    const chain = createPolicyChain("test", [policy], out);

    const first = chain(makeContext("/first"), "first");
    const second = chain(makeContext("/second"), "second");
    await second;
    releaseFirst();
    await first;

    expect(received).toEqual(["second", "first"]);
  });
});
