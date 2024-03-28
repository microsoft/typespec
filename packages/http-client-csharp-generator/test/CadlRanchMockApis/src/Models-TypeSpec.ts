import {
    passOnSuccess,
    ScenarioMockApi,
    mockapi,
    json,
} from "@azure-tools/cadl-ranch-api";

/**
 * Test mock server for `Models-TypeSpec` test project.
 */
export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Models_InputToRoundTripPrimitive = passOnSuccess([
    mockapi.get("/inputToRoundTripPrimitive", (req) => {
        req.expect.bodyEquals({
            requiredString: "test",
            requiredInt: 1,
            requiredNullableString: null,
            requiredNullableInt: null,
            requiredModel: {},
            requiredModel2: {},
            requiredIntList: [],
            requiredStringList: [null, "test"],
            requiredModelList: [null],
            requiredModelRecord: {},
            requiredCollectionWithNullableFloatElement: [null, 12.3],
            requiredCollectionWithNullableBooleanElement: [null, true, false],
            requiredNullableModelList: null,
            requiredNullableStringList: null,
            requiredNullableIntList: null,
        });
        return {
            status: 200,
            body: json({
                requiredString: "test",
                requiredInt: 123,
                requiredInt64: 123456,
                requiredSafeInt: 1234567,
                requiredFloat: 12.3,
                required_Double: 123.456,
                requiredBoolean: true,
                requiredDateTimeOffset: "2023-02-14Z02:08:47",
                requiredTimeSpan: "P1DT2H59M59S",
                requiredCollectionWithNullableFloatElement: [null, 12.3],
            }),
        };
    }),
]);

Scenarios.Models_InputToRoundTripOptional = passOnSuccess([
    mockapi.get("/inputToRoundTripOptional", (req) => {
        req.expect.bodyEquals({
            optionalPlainDate: "2023-02-14",
            optionalPlainTime: "1.02:59:59",
            optionalCollectionWithNullableIntElement: [123, null],
        });
        return {
            status: 200,
            body: json({
                optionalCollectionWithNullableIntElement: [null, 123],
            }),
        };
    }),
]);
Scenarios.Models_InputToRoundTripReadOnly = passOnSuccess([
    mockapi.get("/inputToRoundTripReadOnly", (req) => {
        req.expect.bodyEquals({
            requiredString: "test",
            requiredInt: 2,
            requiredNullableString: null,
            requiredNullableInt: null,
            requiredModel: { requiredList: [null] },
            requiredModel2: { requiredList: [null] },
            requiredIntList: [1, 2],
            requiredStringList: ["a", null],
            requiredModelList: [{ requiredModelRecord: {} }],
            requiredModelRecord: {},
            requiredCollectionWithNullableFloatElement: [],
            requiredCollectionWithNullableBooleanElement: [],
            requiredNullableModelList: null,
            requiredNullableStringList: null,
            requiredNullableIntList: null,
        });
        return {
            status: 200,
            body: json({
                requiredReadonlyString: "test",
                requiredReadonlyInt: 12,
                optionalReadonlyInt: 11,
                requiredReadonlyModel: { requiredList: [] },
                requiredReadonlyFixedStringEnum: "1",
                requiredReadonlyExtensibleEnum: "3",
                optionalReadonlyFixedStringEnum: "2",
                optionalReadonlyExtensibleEnum: "1",
                requiredReadonlyStringList: ["abc"],
                requiredReadonlyIntList: [],
                requiredReadOnlyModelList: [],
                requiredReadOnlyIntRecord: { test: 1 },
                requiredStringRecord: { test: "1" },
                requiredReadOnlyModelRecord: {},
                optionalReadonlyStringList: [null],
                optionalReadOnlyModelList: [],
                optionalReadOnlyStringRecord: {},
                optionalModelRecord: { test: { requiredList: [] } },
                requiredCollectionWithNullableIntElement: [null, 123],
                optionalCollectionWithNullableBooleanElement: [
                    null,
                    false,
                    true,
                ],
            }),
        };
    }),
]);

// Test only single base model
Scenarios.Models_SingleBase = passOnSuccess([
    mockapi.get("/single", (req) => {
        return {
            status: 200,
            body: json({
                kind: "foo",
                size: 123
            }),
        };
    }),
]);
