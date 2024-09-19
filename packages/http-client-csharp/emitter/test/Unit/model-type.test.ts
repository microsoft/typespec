import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Discriminator property", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Base model has discriminator property", async () => {
    const program = await typeSpecCompile(
      `
@doc("The base Pet model")
@discriminator("kind")
model Pet {
    @doc("The name of the pet")
    name: string;
}

@doc("The cat")
model Cat extends Pet {
    kind: "cat";

    @doc("Meow")
    meow: string;
}

@doc("The dog")
model Dog extends Pet {
    kind: "dog";

    @doc("Woof")
    woof: string;
}

op test(@body input: Pet): Pet;
`,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.name === "Pet");
    const catModel = models.find((m) => m.name === "Cat");
    const dogModel = models.find((m) => m.name === "Dog");
    // assert the discriminator property name
    deepStrictEqual("kind", petModel?.discriminatorProperty?.name);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = petModel?.properties.find(
      (p) => p === petModel?.discriminatorProperty,
    );
    strictEqual(discriminatorProperty?.name, "kind");
    strictEqual(discriminatorProperty.serializedName, "kind");
    strictEqual(discriminatorProperty.type.kind, "string");
    strictEqual(discriminatorProperty.optional, false);
    strictEqual(discriminatorProperty.readOnly, false);
    strictEqual(discriminatorProperty.discriminator, true);
    strictEqual(discriminatorProperty.flattenedNames, undefined);
    // assert we will NOT have a DiscriminatorProperty on the derived models
    assert(
      catModel?.discriminatorProperty === undefined,
      "Cat model should not have the discriminator property",
    );
    assert(
      dogModel?.discriminatorProperty === undefined,
      "Dog model should not have the discriminator property",
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = catModel?.properties.find(
      (p) => p === petModel?.discriminatorProperty,
    );
    const dogDiscriminatorProperty = dogModel?.properties.find(
      (p) => p === petModel?.discriminatorProperty,
    );
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property in the properties list",
    );
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property in the properties list",
    );
  });

  it("Discriminator property is enum with no enum value defined", async () => {
    const program = await typeSpecCompile(
      `
        @doc("The pet kind")
        enum PetKind {
            Cat,
            Dog,
        }
        @doc("The base Pet model")
        @discriminator("kind")
        model Pet {
            @doc("The kind of the pet")
            kind: PetKind;
            @doc("The name of the pet")
            name: string;
        }

        @doc("The cat")
        model Cat extends Pet{
            kind: PetKind.Cat;

            @doc("Meow")
            meow: string;
        }

        @doc("The dog")
        model Dog extends Pet{
            kind: PetKind.Dog;

            @doc("Woof")
            woof: string;
        }

        op test(@body input: Pet): Pet;
        `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const pet = models.find((m) => m.name === "Pet");
    assert(pet !== undefined);
    // assert the discriminator property name
    strictEqual("kind", pet?.discriminatorProperty?.name);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = pet?.properties.find((p) => p === pet?.discriminatorProperty);
    strictEqual(discriminatorProperty?.name, "kind");
    strictEqual(discriminatorProperty.serializedName, "kind");
    strictEqual(discriminatorProperty.description, "The kind of the pet");
    strictEqual(discriminatorProperty.type.kind, "enum");
    strictEqual(discriminatorProperty.type.name, "PetKind");
    strictEqual(discriminatorProperty.type.valueType.kind, "string");
    strictEqual(discriminatorProperty.optional, false);
    strictEqual(discriminatorProperty.readOnly, false);
    strictEqual(discriminatorProperty.discriminator, true);
    strictEqual(discriminatorProperty.flattenedNames, undefined);

    // verify derived model Cat
    const cat = models.find((m) => m.name === "Cat");
    assert(cat !== undefined);
    assert(cat.discriminatorValue === "Cat");
    assert(cat.baseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      cat.discriminatorProperty === undefined,
      "Cat model should not have the discriminator property",
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = cat.properties.find((p) => p === pet.discriminatorProperty);
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property in the properties list",
    );

    // verify derived model Dog
    const dog = models.find((m) => m.name === "Dog");
    assert(dog !== undefined);
    assert(dog.discriminatorValue === "Dog");
    assert(dog.baseModel === pet);
    // assert we will NOT have a DiscriminatorProperty on the derived models
    assert(
      dog.discriminatorProperty === undefined,
      "Dog model should not have the discriminator property",
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const dogDiscriminatorProperty = dog.properties.find((p) => p === pet.discriminatorProperty);
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property in the properties list",
    );
  });

  it("Discriminator property is enum with enum value defined", async () => {
    const program = await typeSpecCompile(
      `
        @doc("The pet kind")
        enum PetKind {
            Cat : "cat",
            Dog : "dog",
        }
        @doc("The base Pet model")
        @discriminator("kind")
        model Pet {
            @doc("The kind of the pet")
            kind: PetKind;
            @doc("The name of the pet")
            name: string;
        }

        @doc("The cat")
        model Cat extends Pet{
            kind: PetKind.Cat;

            @doc("Meow")
            meow: string;
        }

        @doc("The dog")
        model Dog extends Pet{
            kind: PetKind.Dog;

            @doc("Woof")
            woof: string;
        }

        op test(@body input: Pet): Pet;
        `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const pet = models.find((m) => m.name === "Pet");
    assert(pet !== undefined);
    // assert the discriminator property name
    strictEqual("kind", pet?.discriminatorProperty?.name);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = pet?.properties.find((p) => p === pet?.discriminatorProperty);
    strictEqual(discriminatorProperty?.name, "kind");
    strictEqual(discriminatorProperty.serializedName, "kind");
    strictEqual(discriminatorProperty.description, "The kind of the pet");
    strictEqual(discriminatorProperty.type.kind, "enum");
    strictEqual(discriminatorProperty.type.name, "PetKind");
    strictEqual(discriminatorProperty.type.valueType.kind, "string");
    strictEqual(discriminatorProperty.optional, false);
    strictEqual(discriminatorProperty.readOnly, false);
    strictEqual(discriminatorProperty.discriminator, true);
    strictEqual(discriminatorProperty.flattenedNames, undefined);

    // verify derived model Cat
    const cat = models.find((m) => m.name === "Cat");
    assert(cat !== undefined);
    assert(cat.discriminatorValue === "cat");
    assert(cat.baseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      cat.discriminatorProperty === undefined,
      "Cat model should not have the discriminator property",
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = cat.properties.find((p) => p === pet.discriminatorProperty);
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property in the properties list",
    );

    // verify derived model Dog
    const dog = models.find((m) => m.name === "Dog");
    assert(dog !== undefined);
    assert(dog.discriminatorValue === "dog");
    assert(dog.baseModel === pet);
    // assert we will NOT have a DiscriminatorProperty on the derived models
    assert(
      dog.discriminatorProperty === undefined,
      "Dog model should not have the discriminator property name",
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const dogDiscriminatorProperty = dog.properties.find((p) => p === pet.discriminatorProperty);
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property in the properties list",
    );
  });
});

describe("Additional Properties property should work with extends syntax", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Model extends Record should have additional properties property", async () => {
    const program = await typeSpecCompile(
      `
@doc("Extends Record<unknown>")
model ExtendsUnknown extends Record<unknown> {
    @doc("The name.")
    name: string;
}

@doc("Extends Record<string>")
model ExtendsString extends Record<string> {
    @doc("The name.")
    name: string;
}

@doc("Extends Record<int32>")
model ExtendsInt32 extends Record<int32> {
    @doc("The name.")
    name: int32;
}

@doc("Extends Record<Foo>")
model ExtendsFoo extends Record<Foo> {
    @doc("The name.")
    name: Foo;
}

@doc("Extends Record<Foo[]>")
model ExtendsFooArray extends Record<Foo[]> {
    @doc("The name.")
    name: Foo[];
}

@doc("The Foo")
model Foo {
    @doc("The name.")
    name: string;
}

@route("/op1")
op op1(@body body: ExtendsUnknown): ExtendsUnknown;

@route("/op2")
op op2(@body body: ExtendsString): ExtendsString;

@route("/op3")
op op3(@body body: ExtendsInt32): ExtendsInt32;

@route("/op4")
op op4(@body body: ExtendsFoo): ExtendsFoo;

@route("/op5")
op op5(@body body: ExtendsFooArray): ExtendsFooArray;
`,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const extendsUnknownModel = models.find((m) => m.name === "ExtendsUnknown");
    const extendsStringModel = models.find((m) => m.name === "ExtendsString");
    const extendsInt32Model = models.find((m) => m.name === "ExtendsInt32");
    const extendsFooModel = models.find((m) => m.name === "ExtendsFoo");
    const extendsFooArrayModel = models.find((m) => m.name === "ExtendsFooArray");
    const fooModel = models.find((m) => m.name === "Foo");
    ok(extendsUnknownModel);
    ok(extendsStringModel);
    ok(extendsInt32Model);
    ok(extendsFooModel);
    ok(extendsFooArrayModel);
    // assert the inherited dictionary type is expected
    strictEqual(extendsUnknownModel.additionalProperties?.kind, "any");

    strictEqual(extendsStringModel.additionalProperties?.kind, "string");

    strictEqual(extendsInt32Model.additionalProperties?.kind, "int32");

    deepStrictEqual(extendsFooModel.additionalProperties, fooModel);

    strictEqual(extendsFooArrayModel.additionalProperties?.kind, "array");
    deepStrictEqual(extendsFooArrayModel.additionalProperties.valueType, fooModel);
  });
});

describe("Additional Properties property should work with is syntax", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Model is Record should have additional properties property", async () => {
    const program = await typeSpecCompile(
      `
@doc("Is Record<unknown>")
model IsUnknown is Record<unknown> {
    @doc("The name.")
    name: string;
}

@doc("Is Record<string>")
model IsString is Record<string> {
    @doc("The name.")
    name: string;
}

@doc("Is Record<int32>")
model IsInt32 is Record<int32> {
    @doc("The name.")
    name: int32;
}

@doc("Is Record<Foo>")
model IsFoo is Record<Foo> {
    @doc("The name.")
    name: Foo;
}

@doc("Is Record<Foo[]>")
model IsFooArray is Record<Foo[]> {
    @doc("The name.")
    name: Foo[];
}

@doc("The Foo")
model Foo {
    @doc("The name.")
    name: string;
}

@route("/op1")
op op1(@body body: IsUnknown): IsUnknown;

@route("/op2")
op op2(@body body: IsString): IsString;

@route("/op3")
op op3(@body body: IsInt32): IsInt32;

@route("/op4")
op op4(@body body: IsFoo): IsFoo;

@route("/op5")
op op5(@body body: IsFooArray): IsFooArray;
`,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const isUnknownModel = models.find((m) => m.name === "IsUnknown");
    const isStringModel = models.find((m) => m.name === "IsString");
    const isInt32Model = models.find((m) => m.name === "IsInt32");
    const isFooModel = models.find((m) => m.name === "IsFoo");
    const isFooArrayModel = models.find((m) => m.name === "IsFooArray");
    const fooModel = models.find((m) => m.name === "Foo");
    assert(isUnknownModel !== undefined);
    assert(isStringModel !== undefined);
    assert(isInt32Model !== undefined);
    assert(isFooModel !== undefined);
    assert(isFooArrayModel !== undefined);
    // assert the inherited dictionary type is expected
    strictEqual(isUnknownModel.additionalProperties?.kind, "any");

    strictEqual(isStringModel.additionalProperties?.kind, "string");

    strictEqual(isInt32Model.additionalProperties?.kind, "int32");

    deepStrictEqual(isFooModel.additionalProperties, fooModel);

    strictEqual(isFooArrayModel.additionalProperties?.kind, "array");
    deepStrictEqual(isFooArrayModel.additionalProperties.valueType, fooModel);
  });
});

describe("Empty models should be returned by tsp", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Empty Model should be returned", async () => {
    const program = await typeSpecCompile(
      `
@doc("Empty model")
@usage(Usage.input)
@access(Access.public)
model Empty {
}

@route("/op1")
op op1(): void;
`,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const isEmptyModel = models.find((m) => m.name === "Empty");
    ok(isEmptyModel);
  });
});

describe("typespec-client-generator-core: general decorators list", () => {
  let runner: TestHost;
  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("@name", async function () {
    const program = await typeSpecCompile(
      `
      @name("XmlBook")
      model Book {
        content: string;
      }

      op test(): Book;
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );

    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    strictEqual(models.length, 1);
    deepStrictEqual(models[0].decorators, [
      {
        name: "TypeSpec.Xml.@name",
        arguments: {
          name: "XmlBook",
        },
      },
    ]);
  });
});
