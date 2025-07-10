import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { getClientOperations, resolveClients } from "../src/client-resolution.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;
beforeEach(async () => {
  runner = await createTypespecHttpClientTestRunner();
});

it("should move operation to the client location", async () => {
  await runner.compile(`
    @service
    namespace MyClient {
       interface SubA {
          @get
          op subA(): string;
          @clientLocation(MyClient)
          @post
          op subA2(): string;
       }
    }
    `);

  const clients = ignoreDiagnostics(resolveClients(runner.program));
  expect(clients.length).toBe(1);
  const myClient = clients[0];
  const subClient = myClient.subClients[0];

  const subClientOperations = getClientOperations(runner.program, subClient);
  const myClientOperations = getClientOperations(runner.program, myClient);
  expect(myClientOperations).toHaveLength(1);
  expect(myClientOperations[0].name).toBe("subA2");
  expect(subClientOperations).toHaveLength(1);
  expect(subClientOperations[0].name).toBe("subA");
  expect(subClient.name).toBe("SubA");
});
