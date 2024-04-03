import { TestHost } from "@typespec/compiler/testing";
import assert from "assert";
import { createModel } from "../../src/lib/clientModelBuilder.js";
import {
    typeSpecCompile,
    createEmitterContext,
    createEmitterTestHost,
    navigateModels,
    createNetSdkContext
} from "./utils/TestUtil.js";
import isEqual from "lodash.isequal";
import {
    InputDictionaryType,
    InputEnumType,
    InputListType,
    InputModelType
} from "../../src/type/inputType.js";
import { getAllHttpServices } from "@typespec/http";
import { InputTypeKind } from "../../src/type/inputTypeKind.js";
import { InputPrimitiveTypeKind } from "../../src/type/inputPrimitiveTypeKind.js";
import { InputIntrinsicTypeKind } from "../../src/type/inputIntrinsicTypeKind.js";
import { InputModelProperty } from "../../src/type/inputModelProperty.js";

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
        assert(
            isEqual("kind", petModel?.DiscriminatorPropertyName),
            `Discriminator property name is not correct, got ${petModel?.DiscriminatorPropertyName}`
        );
        // assert we have a property corresponding to the discriminator property above on the base model
        const discriminatorProperty = petModel?.Properties.find(
            (p) => p.Name === petModel?.DiscriminatorPropertyName
        );
        assert(
            isEqual(
                {
                    Name: "kind",
                    SerializedName: "kind",
                    Type: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    IsRequired: true,
                    IsReadOnly: false,
                    IsDiscriminator: true,
                    Description: "Discriminator"
                } as InputModelProperty,
                discriminatorProperty
            ),
            `Discriminator property is not correct, got ${JSON.stringify(
                discriminatorProperty
            )}`
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
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const pet = modelMap.get("Pet");
        assert(pet !== undefined);
        // assert the discriminator property name
        assert(
            isEqual("kind", pet?.DiscriminatorPropertyName),
            `Discriminator property name is not correct, got ${pet?.DiscriminatorPropertyName}`
        );
        // assert we have a property corresponding to the discriminator property above on the base model
        const discriminatorProperty = pet?.Properties.find(
            (p) => p.Name === pet?.DiscriminatorPropertyName
        );
        assert(
            isEqual(
                {
                    Name: "kind",
                    SerializedName: "kind",
                    Description: "The kind of the pet",
                    Type: {
                        Kind: InputTypeKind.Enum,
                        Name: "PetKind",
                        Namespace: "Azure.Csharp.Testing",
                        Description: "The pet kind",
                        Accessibility: undefined,
                        Deprecated: undefined,
                        EnumValueType: "String",
                        AllowedValues: [
                            {
                                Name: "Cat",
                                Value: "Cat",
                                Description: undefined
                            },
                            {
                                Name: "Dog",
                                Value: "Dog",
                                Description: undefined
                            }
                        ],
                        IsExtensible: false,
                        IsNullable: false,
                        Usage: "None"
                    },
                    IsRequired: true,
                    IsReadOnly: false,
                    IsDiscriminator: true
                } as InputModelProperty,
                discriminatorProperty
            ),
            `Discriminator property is not correct, got ${JSON.stringify(
                discriminatorProperty
            )}`
        );

        // verify derived model Cat
        const cat = modelMap.get("Cat");
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
        const dog = modelMap.get("Dog");
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
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const pet = modelMap.get("Pet");
        assert(pet !== undefined);
        // assert the discriminator property name
        assert(
            isEqual("kind", pet?.DiscriminatorPropertyName),
            `Discriminator property name is not correct, got ${pet?.DiscriminatorPropertyName}`
        );
        // assert we have a property corresponding to the discriminator property above on the base model
        const discriminatorProperty = pet?.Properties.find(
            (p) => p.Name === pet?.DiscriminatorPropertyName
        );
        assert(
            isEqual(
                {
                    Name: "kind",
                    SerializedName: "kind",
                    Description: "The kind of the pet",
                    Type: {
                        Kind: InputTypeKind.Enum,
                        Name: "PetKind",
                        Namespace: "Azure.Csharp.Testing",
                        Accessibility: undefined,
                        Deprecated: undefined,
                        Description: "The pet kind",
                        EnumValueType: "String",
                        AllowedValues: [
                            {
                                Name: "Cat",
                                Value: "cat",
                                Description: undefined
                            },
                            {
                                Name: "Dog",
                                Value: "dog",
                                Description: undefined
                            }
                        ],
                        IsExtensible: false,
                        IsNullable: false,
                        Usage: "None"
                    },
                    IsRequired: true,
                    IsReadOnly: false,
                    IsDiscriminator: true
                } as InputModelProperty,
                discriminatorProperty
            ),
            `Discriminator property is not correct, got ${JSON.stringify(
                discriminatorProperty
            )}`
        );

        // verify derived model Cat
        const cat = modelMap.get("Cat");
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
        const dog = modelMap.get("Dog");
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
        const extendsUnknownModel = models.find(
            (m) => m.Name === "ExtendsUnknown"
        );
        const extendsStringModel = models.find(
            (m) => m.Name === "ExtendsString"
        );
        const extendsInt32Model = models.find((m) => m.Name === "ExtendsInt32");
        const extendsFooModel = models.find((m) => m.Name === "ExtendsFoo");
        const extendsFooArrayModel = models.find(
            (m) => m.Name === "ExtendsFooArray"
        );
        const fooModel = models.find((m) => m.Name === "Foo");
        assert(extendsUnknownModel !== undefined);
        assert(extendsStringModel !== undefined);
        assert(extendsInt32Model !== undefined);
        assert(extendsFooModel !== undefined);
        assert(extendsFooArrayModel !== undefined);
        // assert the inherited dictionary type is expected
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Intrinsic,
                        Name: InputIntrinsicTypeKind.Unknown,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                extendsUnknownModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                extendsUnknownModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                extendsStringModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                extendsStringModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.Int32,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                extendsInt32Model.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                extendsInt32Model.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: fooModel
                } as InputDictionaryType,
                extendsFooModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                extendsFooModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Array,
                        Name: InputTypeKind.Array,
                        ElementType: fooModel,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                extendsFooArrayModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                extendsFooArrayModel.InheritedDictionaryType
            )}`
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
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Intrinsic,
                        Name: InputIntrinsicTypeKind.Unknown,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                isUnknownModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                isUnknownModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                isStringModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                isStringModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.Int32,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                isInt32Model.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                isInt32Model.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: fooModel
                } as InputDictionaryType,
                isFooModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                isFooModel.InheritedDictionaryType
            )}`
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Dictionary,
                    Name: InputTypeKind.Dictionary,
                    IsNullable: false,
                    KeyType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    ValueType: {
                        Kind: InputTypeKind.Array,
                        Name: InputTypeKind.Array,
                        ElementType: fooModel,
                        IsNullable: false
                    }
                } as InputDictionaryType,
                isFooArrayModel.InheritedDictionaryType
            ),
            `Inherited dictionary type is not correct, got ${JSON.stringify(
                isFooArrayModel.InheritedDictionaryType
            )}`
        );
    });
});
