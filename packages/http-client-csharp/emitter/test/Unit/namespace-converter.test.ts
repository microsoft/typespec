import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { fromSdkNamespaces } from "../../src/lib/namespace-converter.js";
import { InputNamespace } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Namespace Converter", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("fromSdkNamespaces", () => {
    it("Are cached and parsed correctly", async () => {
      const program = await typeSpecCompile(
        `
            namespace TestNsOne {
                @route("/test1")
                op testOperationFoo(): void;
            }
            
            namespace TestNsTwo {
                @route("/test2")
                op testOperationFoo(): void;
            }

            namespace TestNestedNs {
                namespace TestChildNamespace {
                    namespace One {
                            @route("/testNested1")
                            op testOperationFoo(): void;
                    }
                    namespace Two {
                         @route("/testNested2")
                        op testOperationFoo(): void;
                    }
                }
            }
            `,
        runner,
        { IsNamespaceNeeded: true, IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const sdkPackage = sdkContext.sdkPackage;
      const parsedNamespaces = fromSdkNamespaces(sdkContext, sdkPackage.namespaces);

      strictEqual(parsedNamespaces.length, 1);

      const rootNamespace = parsedNamespaces[0];
      strictEqual(rootNamespace.fullName, "Azure");

      let testNamespace: InputNamespace | undefined = rootNamespace.namespaces[0];
      while (testNamespace?.fullName !== "Azure.Csharp.Testing") {
        if (testNamespace.namespaces.length > 0) {
          testNamespace = testNamespace?.namespaces[0];
        }
      }

      ok(testNamespace);
      strictEqual(testNamespace.fullName, "Azure.Csharp.Testing");
      strictEqual(testNamespace.namespaces.length, 3);

      strictEqual(testNamespace.namespaces[0].fullName, "Azure.Csharp.Testing.TestNsOne");
      strictEqual(testNamespace.namespaces[1].fullName, "Azure.Csharp.Testing.TestNsTwo");
      strictEqual(testNamespace.namespaces[2].fullName, "Azure.Csharp.Testing.TestNestedNs");

      const nestedNamespaces = testNamespace.namespaces[2].namespaces;
      strictEqual(nestedNamespaces.length, 1);

      const testChildNamespace = nestedNamespaces[0];
      strictEqual(
        testChildNamespace.fullName,
        "Azure.Csharp.Testing.TestNestedNs.TestChildNamespace",
      );
      strictEqual(testChildNamespace.namespaces.length, 2);

      // validate the namespace cache
      const cachedNamespaces = sdkContext.__typeCache.namespaces;
      strictEqual(cachedNamespaces.size, 9);
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNsOne"));
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNsTwo"));
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNestedNs"));
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNestedNs.TestChildNamespace"));
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNestedNs.TestChildNamespace.One"));
      ok(cachedNamespaces.get("Azure.Csharp.Testing.TestNestedNs.TestChildNamespace.Two"));
    });
  });
});
