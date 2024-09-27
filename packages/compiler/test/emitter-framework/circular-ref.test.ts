import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model, ModelProperty, Program, Type, getTypeName } from "../../src/core/index.js";
import {
  ArrayBuilder,
  Context,
  EmitEntity,
  EmitterOutput,
  ObjectBuilder,
  ReferenceCycle,
  Scope,
  TypeEmitter,
  createAssetEmitter,
} from "../../src/emitter-framework/index.js";
import { getHostForTypeSpecFile } from "./host.js";

describe("compiler: emitter-framework: circular references", () => {
  interface FindOptions {
    modelsInline: boolean;
    circleReference: boolean;
  }

  interface CircularRefEntry {
    target: EmitEntity<any>;
    cycle: ReferenceCycle;
  }
  async function findCircularReferences(code: string, options: FindOptions) {
    const invalidReferences: CircularRefEntry[] = [];

    const cls = class extends TypeEmitter<any, any> {
      modelDeclaration(model: Model, _: string): EmitterOutput<object> {
        const obj = new ObjectBuilder();
        obj.set("props", this.emitter.emitModelProperties(model));
        if (options.modelsInline) {
          return obj; // Never make a declaration
        } else {
          return this.emitter.result.declaration(model.name, obj);
        }
      }

      modelProperties(model: Model) {
        const arr = new ArrayBuilder();
        for (const prop of model.properties.values()) {
          arr.push(this.emitter.emitModelProperty(prop));
        }
        return arr;
      }

      modelPropertyLiteral(property: ModelProperty) {
        if (options.circleReference) {
          return this.emitter.emitTypeReference(property.type);
        } else {
          const obj = new ObjectBuilder();
          obj.set("name", property.name);
          return obj;
        }
      }

      arrayLiteral(array: Model, elementType: Type) {
        return { type: "array", items: this.emitter.emitTypeReference(elementType) };
      }

      programContext(program: Program): Context {
        const sourceFile = this.emitter.createSourceFile("main");
        return { scope: sourceFile.globalScope };
      }

      circularReference(target: EmitEntity<any>, scope: Scope<any>, cycle: ReferenceCycle) {
        if (!cycle.containsDeclaration) {
          invalidReferences.push({ target, cycle });
          return target;
        }
        return super.circularReference(target, scope, cycle);
      }
    };

    const host = await getHostForTypeSpecFile(code);
    const assetEmitter = createAssetEmitter(host.program, cls, {
      emitterOutputDir: host.program.compilerOptions.outputDir!,
      options: {},
    } as any);
    assetEmitter.emitProgram();

    return invalidReferences;
  }

  const selfRef = `model Foo { foo: Foo }`;
  it("self referencing with declaration works fine", async () => {
    const invalidReferences = await findCircularReferences(selfRef, {
      modelsInline: false,
      circleReference: true,
    });
    strictEqual(invalidReferences.length, 0);
  });

  it("self referencing without declaration report circular reference", async () => {
    const invalidReferences = await findCircularReferences(selfRef, {
      modelsInline: true,
      circleReference: true,
    });
    strictEqual(invalidReferences.length, 1);
  });

  it("without circular reference inline types cause no issue", async () => {
    const invalidReferences = await findCircularReferences(selfRef, {
      modelsInline: true,
      circleReference: false,
    });
    strictEqual(invalidReferences.length, 0);
  });

  it("resolve the circular reference stack", async () => {
    const code = `
      model First { foo: Foo }
      model Foo { foo: Bar }
      model Bar { bar: Foo }
    `;
    const result = await findCircularReferences(code, {
      modelsInline: true,
      circleReference: true,
    });
    strictEqual(result.length, 1);

    deepStrictEqual(result[0].cycle.containsDeclaration, false);
    deepStrictEqual(
      [...result[0].cycle].map((x) => getTypeName(x.type)),
      ["Foo", "Foo.foo", "Bar", "Bar.bar"],
    );
  });

  describe("cycle with declaration inside", () => {
    it("doesn't report issue if referencing a declaration in the cycle", async () => {
      const code = `
        model First { foo: Foo }
        model Foo { foo: Foo[] }
      `;
      const result = await findCircularReferences(code, {
        modelsInline: false,
        circleReference: true,
      });
      strictEqual(result.length, 0);
    });
    it("doesn't report issue if referencing an inline type in the cycle", async () => {
      const code = `
        model First { foo: Foo[] }
        model Foo { foo: Foo[] }
      `;
      const result = await findCircularReferences(code, {
        modelsInline: false,
        circleReference: true,
      });
      strictEqual(result.length, 0);
    });
  });
});
