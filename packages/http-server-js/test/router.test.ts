// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import type * as http from "node:http";
import { describe, expect, it } from "vitest";
import { createPolicyChain, type HttpContext, type Policy } from "../src/helpers/router.js";

function makeContext(): HttpContext {
  return {
    request: {} as http.IncomingMessage,
    response: {} as http.ServerResponse,
    errorHandlers: {
      onRequestNotFound: () => {},
      onInvalidRequest: () => {},
      onInternalError: () => {},
    },
  };
}

describe("createPolicyChain", () => {
  it("returns the out function directly when no policies are provided", () => {
    const out = async (_ctx: HttpContext) => {};
    const chain = createPolicyChain("test", [], out);
    expect(chain).toBe(out);
  });

  it("returns a Promise when policies are specified (fixes TypeError on .catch)", async () => {
    const policy: Policy = async (ctx, next) => {
      next();
    };
    const out = async (_ctx: HttpContext) => {};
    const chain = createPolicyChain("test", [policy], out);
    const ctx = makeContext();
    const result = chain(ctx);
    // Must be a Promise (so .catch() doesn't throw TypeError)
    expect(result).toBeInstanceOf(Promise);
    await result;
  });

  it("calls the out function after a single policy", async () => {
    const calls: string[] = [];
    const policy: Policy = async (ctx, next) => {
      calls.push("policy");
      next();
    };
    const out = async (_ctx: HttpContext) => {
      calls.push("out");
    };
    const chain = createPolicyChain("test", [policy], out);
    await chain(makeContext());
    expect(calls).toEqual(["policy", "out"]);
  });

  it("calls policies in order before calling out", async () => {
    const calls: string[] = [];
    const policy1: Policy = (ctx, next) => {
      calls.push("policy1");
      next();
    };
    const policy2: Policy = (ctx, next) => {
      calls.push("policy2");
      next();
    };
    const out = async (_ctx: HttpContext) => {
      calls.push("out");
    };
    const chain = createPolicyChain("test", [policy1, policy2], out);
    await chain(makeContext());
    expect(calls).toEqual(["policy1", "policy2", "out"]);
  });

  it("propagates errors from out through the returned Promise", async () => {
    const policy: Policy = (ctx, next) => {
      next();
    };
    const out = async (_ctx: HttpContext) => {
      throw new Error("test error");
    };
    const chain = createPolicyChain("test", [policy], out);
    await expect(chain(makeContext())).rejects.toThrow("test error");
  });

  it("propagates errors thrown synchronously in a policy", async () => {
    const policy: Policy = (_ctx, _next) => {
      throw new Error("policy error");
    };
    const out = async (_ctx: HttpContext) => {};
    const chain = createPolicyChain("test", [policy], out);
    await expect(chain(makeContext())).rejects.toThrow("policy error");
  });

  it("passes updated request from policy to out", async () => {
    let receivedRequest: http.IncomingMessage | undefined;
    const newRequest = { url: "/updated" } as http.IncomingMessage;
    const policy: Policy = (ctx, next) => {
      next(newRequest);
    };
    const out = async (ctx: HttpContext) => {
      receivedRequest = ctx.request;
    };
    const chain = createPolicyChain("test", [policy], out);
    await chain(makeContext());
    expect(receivedRequest).toBe(newRequest);
  });
});
