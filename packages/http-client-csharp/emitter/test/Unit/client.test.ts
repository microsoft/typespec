import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Parent property", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Base model has parent property", async () => {
    const program = await typeSpecCompile(
      `
      model Parent{
        name: string;
      }
      model Child extends Parent{
        id: string;
      }

      @route("/ParentC")
      interface ParentC {
        @get list(): Parent[];
        @get read(@path id: string): Parent;
      }
      interface ChildC {
          @get list(): Child[];
        }
        
      @client({
        name: "ParentC",
        service: ParentC.Client,
      })

      @groupOperation
      interface Group {
        ParentC.list;
      }  
      `,
      runner,
      { IsTCGCNeeded: true }
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.Name === "Widget");
    const catModel = models.find((m) => m.Name === "Foo");
    strictEqual(catModel?.BaseModel, petModel);
    });
});
