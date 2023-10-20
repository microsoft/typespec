import { deepStrictEqual, strictEqual } from "assert";
import { Model, ModelProperty, Program, getTypeName } from "../../src/core/index.js";
import {
  ArrayBuilder,
  Context,
  EmitEntity,
  EmitterOutput,
  ObjectBuilder,
  ReferenceChainEntry,
  Scope,
  TypeEmitter,
  createAssetEmitter,
} from "../../src/emitter-framework/index.js";
import { getHostForTypeSpecFile } from "./host.js";

describe("compiler: emitter-framework: circular references", () => {
  interface FindOptions {
    noDeclaration: boolean;
    circleReference: boolean;
  }

  interface CircularRefEntry {
    target: EmitEntity<any>;
    circularChain: ReferenceChainEntry[];
  }
  async function findCircularReferences(code: string, options: FindOptions) {
    const invalidReferences: CircularRefEntry[] = [];

    const cls = class extends TypeEmitter<any, any> {
      modelDeclaration(model: Model, _: string): EmitterOutput<object> {
        const obj = new ObjectBuilder();
        obj.set("props", this.emitter.emitModelProperties(model));
        if (options.noDeclaration) {
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

      programContext(program: Program): Context {
        const sourceFile = this.emitter.createSourceFile("main");
        return { scope: sourceFile.globalScope };
      }

      circularReference(
        target: EmitEntity<any>,
        scope: Scope<any>,
        circularChain: ReferenceChainEntry[]
      ) {
        if (target.kind !== "declaration") {
          invalidReferences.push({ target, circularChain });
          return target;
        }
        return super.circularReference(target, scope, circularChain);
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
      noDeclaration: false,
      circleReference: true,
    });
    strictEqual(invalidReferences.length, 0);
  });

  it("self referencing without declaration report circular reference", async () => {
    const invalidReferences = await findCircularReferences(selfRef, {
      noDeclaration: true,
      circleReference: true,
    });
    strictEqual(invalidReferences.length, 1);
  });

  it("without circular reference inline types cause no issue", async () => {
    const invalidReferences = await findCircularReferences(selfRef, {
      noDeclaration: true,
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
      noDeclaration: true,
      circleReference: true,
    });
    strictEqual(result.length, 1);

    deepStrictEqual(
      result[0].circularChain.map((x) => getTypeName(x.type)),
      ["Foo", "Foo.foo", "Bar", "Bar.bar"]
    );
  });
});
