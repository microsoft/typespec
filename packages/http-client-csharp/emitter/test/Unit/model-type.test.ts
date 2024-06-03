import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputModelProperty } from "../../src/type/input-model-property.js";
import { InputTypeKind } from "../../src/type/input-type-kind.js";
import { InputDictionaryType } from "../../src/type/input-type.js";
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
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.Name === "Pet");
    const catModel = models.find((m) => m.Name === "Cat");
    const dogModel = models.find((m) => m.Name === "Dog");
    // assert the discriminator property name
    deepStrictEqual("kind", petModel?.DiscriminatorPropertyName);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = petModel?.Properties.find(
      (p) => p.Name === petModel?.DiscriminatorPropertyName
    );
    deepStrictEqual(
      {
        Name: "kind",
        SerializedName: "kind",
        Type: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        IsRequired: true,
        IsReadOnly: false,
        IsDiscriminator: true,
        Description: "Discriminator",
        FlattenedNames: undefined,
      } as InputModelProperty,
      discriminatorProperty
    );
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      catModel?.DiscriminatorPropertyName === undefined,
      "Cat model should not have the discriminator property name"
    );
    assert(
      dogModel?.DiscriminatorPropertyName === undefined,
      "Dog model should not have the discriminator property name"
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = catModel?.Properties.find(
      (p) => p.Name === petModel?.DiscriminatorPropertyName
    );
    const dogDiscriminatorProperty = dogModel?.Properties.find(
      (p) => p.Name === petModel?.DiscriminatorPropertyName
    );
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property"
    );
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property"
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
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const pet = models.find((m) => m.Name === "Pet");
    assert(pet !== undefined);
    // assert the discriminator property name
    strictEqual("kind", pet?.DiscriminatorPropertyName);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = pet?.Properties.find(
      (p) => p.Name === pet?.DiscriminatorPropertyName
    );
    deepStrictEqual(
      {
        Name: "kind",
        SerializedName: "kind",
        Description: "The kind of the pet",
        Type: {
          Kind: "enum",
          Name: "PetKind",
          Namespace: "Azure.Csharp.Testing",
          Description: "The pet kind",
          Accessibility: undefined,
          Deprecated: undefined,
          ValueType: {
            Kind: "string",
            IsNullable: false,
            Encode: undefined,
          },
          Values: [
            {
              Name: "Cat",
              Value: "Cat",
              Description: undefined,
            },
            {
              Name: "Dog",
              Value: "Dog",
              Description: undefined,
            },
          ],
          IsExtensible: false,
          IsNullable: false,
          Usage: "RoundTrip",
        },
        IsRequired: true,
        IsReadOnly: false,
        IsDiscriminator: true,
        FlattenedNames: undefined,
      } as InputModelProperty,
      discriminatorProperty
    );

    // verify derived model Cat
    const cat = models.find((m) => m.Name === "Cat");
    assert(cat !== undefined);
    assert(cat.DiscriminatorValue === "Cat");
    assert(cat.BaseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      cat.DiscriminatorPropertyName === undefined,
      "Cat model should not have the discriminator property name"
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = cat.Properties.find(
      (p) => p.Name === pet.DiscriminatorPropertyName
    );
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property"
    );

    // verify derived model Dog
    const dog = models.find((m) => m.Name === "Dog");
    assert(dog !== undefined);
    assert(dog.DiscriminatorValue === "Dog");
    assert(dog.BaseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      dog.DiscriminatorPropertyName === undefined,
      "Dog model should not have the discriminator property name"
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const dogDiscriminatorProperty = dog.Properties.find(
      (p) => p.Name === pet.DiscriminatorPropertyName
    );
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property"
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
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const pet = models.find((m) => m.Name === "Pet");
    assert(pet !== undefined);
    // assert the discriminator property name
    strictEqual("kind", pet?.DiscriminatorPropertyName);
    // assert we have a property corresponding to the discriminator property above on the base model
    const discriminatorProperty = pet?.Properties.find(
      (p) => p.Name === pet?.DiscriminatorPropertyName
    );
    deepStrictEqual(
      {
        Name: "kind",
        SerializedName: "kind",
        Description: "The kind of the pet",
        Type: {
          Kind: "enum",
          Name: "PetKind",
          Namespace: "Azure.Csharp.Testing",
          Accessibility: undefined,
          Deprecated: undefined,
          Description: "The pet kind",
          ValueType: {
            Kind: "string",
            IsNullable: false,
            Encode: undefined,
          },
          Values: [
            {
              Name: "Cat",
              Value: "cat",
              Description: undefined,
            },
            {
              Name: "Dog",
              Value: "dog",
              Description: undefined,
            },
          ],
          IsExtensible: false,
          IsNullable: false,
          Usage: "RoundTrip",
        },
        IsRequired: true,
        IsReadOnly: false,
        IsDiscriminator: true,
        FlattenedNames: undefined,
      } as InputModelProperty,
      discriminatorProperty
    );

    // verify derived model Cat
    const cat = models.find((m) => m.Name === "Cat");
    assert(cat !== undefined);
    assert(cat.DiscriminatorValue === "cat");
    assert(cat.BaseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      cat.DiscriminatorPropertyName === undefined,
      "Cat model should not have the discriminator property name"
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const catDiscriminatorProperty = cat.Properties.find(
      (p) => p.Name === pet.DiscriminatorPropertyName
    );
    assert(
      catDiscriminatorProperty === undefined,
      "Cat model should not have the discriminator property"
    );

    // verify derived model Dog
    const dog = models.find((m) => m.Name === "Dog");
    assert(dog !== undefined);
    assert(dog.DiscriminatorValue === "dog");
    assert(dog.BaseModel === pet);
    // assert we will NOT have a DiscriminatorPropertyName on the derived models
    assert(
      dog.DiscriminatorPropertyName === undefined,
      "Dog model should not have the discriminator property name"
    );
    // assert we will NOT have a property corresponding to the discriminator property on the derived models
    const dogDiscriminatorProperty = dog.Properties.find(
      (p) => p.Name === pet.DiscriminatorPropertyName
    );
    assert(
      dogDiscriminatorProperty === undefined,
      "Dog model should not have the discriminator property"
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
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const extendsUnknownModel = models.find((m) => m.Name === "ExtendsUnknown");
    const extendsStringModel = models.find((m) => m.Name === "ExtendsString");
    const extendsInt32Model = models.find((m) => m.Name === "ExtendsInt32");
    const extendsFooModel = models.find((m) => m.Name === "ExtendsFoo");
    const extendsFooArrayModel = models.find((m) => m.Name === "ExtendsFooArray");
    const fooModel = models.find((m) => m.Name === "Foo");
    assert(extendsUnknownModel !== undefined);
    assert(extendsStringModel !== undefined);
    assert(extendsInt32Model !== undefined);
    assert(extendsFooModel !== undefined);
    assert(extendsFooArrayModel !== undefined);
    // assert the inherited dictionary type is expected
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "any",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      extendsUnknownModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      extendsStringModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "int32",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      extendsInt32Model.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: fooModel,
      } as InputDictionaryType,
      extendsFooModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: InputTypeKind.Array,
          Name: InputTypeKind.Array,
          ElementType: fooModel,
          IsNullable: false,
        },
      } as InputDictionaryType,
      extendsFooArrayModel.InheritedDictionaryType
    );
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
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const isUnknownModel = models.find((m) => m.Name === "IsUnknown");
    const isStringModel = models.find((m) => m.Name === "IsString");
    const isInt32Model = models.find((m) => m.Name === "IsInt32");
    const isFooModel = models.find((m) => m.Name === "IsFoo");
    const isFooArrayModel = models.find((m) => m.Name === "IsFooArray");
    const fooModel = models.find((m) => m.Name === "Foo");
    assert(isUnknownModel !== undefined);
    assert(isStringModel !== undefined);
    assert(isInt32Model !== undefined);
    assert(isFooModel !== undefined);
    assert(isFooArrayModel !== undefined);
    // assert the inherited dictionary type is expected
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "any",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      isUnknownModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      isStringModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: "int32",
          IsNullable: false,
          Encode: undefined,
        },
      } as InputDictionaryType,
      isInt32Model.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: fooModel,
      } as InputDictionaryType,
      isFooModel.InheritedDictionaryType
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Dictionary,
        Name: InputTypeKind.Dictionary,
        IsNullable: false,
        KeyType: {
          Kind: "string",
          IsNullable: false,
        },
        ValueType: {
          Kind: InputTypeKind.Array,
          Name: InputTypeKind.Array,
          ElementType: fooModel,
          IsNullable: false,
        },
      } as InputDictionaryType,
      isFooArrayModel.InheritedDictionaryType
    );
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
      { IsTCGCNeeded: true }
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const isEmptyModel = models.find((m) => m.Name === "Empty");
    assert(isEmptyModel !== undefined);
    // assert the inherited dictionary type is expected
  });
});
