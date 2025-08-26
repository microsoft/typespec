vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { $dynamicModel, isDynamicModel } from "../../src/lib/decorators.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test dynamicModel decorator", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should mark a model as dynamic", async () => {
    const program = await typeSpecCompile(
      `
      @dynamicModel
      model Pet {
        name: string;
        age: int32;
      }
      
      op getPet(): Pet;
      `,
      runner,
    );
    
    // Check that the decorator was applied correctly
    const petModel = program.resolveTypeReference("Pet")[0];
    if (petModel && petModel.kind === "Model") {
      expect(isDynamicModel(program, petModel)).toBe(true);
    }
  });

  it("should mark a namespace as dynamic", async () => {
    const program = await typeSpecCompile(
      `
      @dynamicModel
      namespace PetStore {
        model Dog {
          breed: string;
        }
      }
      
      op getDog(): PetStore.Dog;
      `,
      runner,
    );
    
    // Check that the decorator was applied correctly
    const petStoreNamespace = program.resolveTypeReference("PetStore")[0];
    if (petStoreNamespace && petStoreNamespace.kind === "Namespace") {
      expect(isDynamicModel(program, petStoreNamespace)).toBe(true);
    }
  });
});