import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import isEqual from "lodash.isequal";
import {
    createEmitterContext,
    createEmitterTestHost,
    createNetSdkContext,
    navigateModels,
    typeSpecCompile
} from "./utils/TestUtil.js";
import { getAllHttpServices } from "@typespec/http";
import { loadOperation } from "../../src/lib/operation.js";
import {
    InputEnumType,
    InputModelType,
    InputPrimitiveType
} from "../../src/type/inputType.js";
import { InputPrimitiveTypeKind } from "../../src/type/inputPrimitiveTypeKind.js";
import { InputTypeKind } from "../../src/type/inputTypeKind.js";

describe("Test string format", () => {
    let runner: TestHost;

    beforeEach(async () => {
        runner = await createEmitterTestHost();
    });

    it("scalar url as parameter", async () => {
        const program = await typeSpecCompile(
            `
            op test(@path sourceUrl: url): void;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Uri,
                    IsNullable: false
                } as InputPrimitiveType,
                operation.Parameters[0].Type
            )
        );
    });

    it("scalar url as model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model Foo {
                @doc("The source url.")
                source: url;
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const foo = modelMap.get("Foo");
        assert(foo !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Uri,
                    IsNullable: false
                } as InputPrimitiveType,
                foo.Properties[0].Type
            )
        );
    });

    it("format uri on operation parameter", async () => {
        const program = await typeSpecCompile(
            `
            op test(@path @format("Uri")sourceUrl: string): void;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Uri,
                    IsNullable: false
                },
                operation.Parameters[0].Type
            )
        );
    });

    it("format uri on model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model Foo {
                @doc("The source url.")
                @format("Uri")
                source: string
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const foo = modelMap.get("Foo");
        assert(foo !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Uri,
                    IsNullable: false
                },
                foo.Properties[0].Type
            )
        );
    });

    it("format uuid on operation parameter", async () => {
        const program = await typeSpecCompile(
            `
            op test(@path @format("uuid")subscriptionId: string): void;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Guid,
                    IsNullable: false
                },
                operation.Parameters[0].Type
            )
        );
    });

    it("format on model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model Foo {
                @doc("The subscription id.")
                @format("uuid")
                subscriptionId: string
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const foo = modelMap.get("Foo");
        assert(foo !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.Guid,
                    IsNullable: false
                } as InputPrimitiveType,
                foo.Properties[0].Type
            )
        );
    });
});
