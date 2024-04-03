import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import { createModel } from "../../src/lib/clientModelBuilder.js";
import {
    typeSpecCompile,
    createEmitterContext,
    createEmitterTestHost,
    createNetSdkContext
} from "./utils/TestUtil.js";
import { InputEnumType, InputListType } from "../../src/type/inputType.js";
import isEqual from "lodash.isequal";
import { InputTypeKind } from "../../src/type/inputTypeKind.js";
import { InputPrimitiveTypeKind } from "../../src/type/inputPrimitiveTypeKind.js";
import { Console } from "console";

describe("Test GetInputType for scalar", () => {
    let runner: TestHost;

    beforeEach(async () => {
        runner = await createEmitterTestHost();
    });

    it("azureLocation scalar", async () => {
        const program = await typeSpecCompile(
            `
        op test(@query location: azureLocation): void;
      `,
            runner,
            { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
        );
        runner.compileAndDiagnose;
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const root = createModel(sdkContext);
        deepStrictEqual(
            root.Clients[0].Operations[0].Parameters[0].Type.Kind,
            InputTypeKind.Primitive
        );
        deepStrictEqual(
            root.Clients[0].Operations[0].Parameters[0].Type.Name,
            InputPrimitiveTypeKind.AzureLocation
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.AzureLocation,
                    IsNullable: false
                },
                root.Clients[0].Operations[0].Parameters[0].Type
            )
        );
    });
});
