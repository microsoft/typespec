import {
    SdkContext,
    SdkEnumType,
    SdkEnumValueType
} from "@azure-tools/typespec-client-generator-core";
import { InputEnumType } from "./inputType.js";
import { Enum, UsageFlags } from "@typespec/compiler";
import { InputTypeKind } from "./inputTypeKind.js";
import { getFullNamespaceString } from "../lib/utils.js";
import { InputEnumTypeValue } from "./inputEnumTypeValue.js";
import { setUsage } from "../lib/model.js";
import { Usage } from "./usage.js";

export function fromSdkEnumType(
    enumType: SdkEnumType,
    context: SdkContext,
    enums: Map<string, InputEnumType>,
    addToCollection: boolean = true
): InputEnumType {
    let enumName = enumType.generatedName || enumType.name;
    let inputEnumType = enums.get(enumName);
    if (inputEnumType === undefined) {
        const newInputEnumType: InputEnumType = {
            Kind: InputTypeKind.Enum,
            Name: enumName,
            EnumValueType: enumType.valueType.kind,
            AllowedValues: enumType.values.map((v) => fromSdkEnumValueType(v)),
            Namespace: getFullNamespaceString(
                (enumType.__raw! as Enum).namespace
            ),
            Accessibility: enumType.access,
            Deprecated: enumType.deprecation,
            Description: enumType.description,
            IsExtensible: enumType.isFixed ? false : true,
            IsNullable: enumType.nullable,
            Usage: fromUsageFlags(enumType.usage)
        };
        setUsage(context, enumType.__raw! as Enum, newInputEnumType);
        if (addToCollection) enums.set(enumName, newInputEnumType);
        inputEnumType = newInputEnumType;
    }
    inputEnumType.IsNullable = enumType.nullable; // TO-DO: https://github.com/Azure/autorest.csharp/issues/4314
    return inputEnumType;
}

export function fromSdkEnumValueType(
    enumValueType: SdkEnumValueType
): InputEnumTypeValue {
    return {
        Name: enumValueType.name,
        Value: enumValueType.value,
        Description: enumValueType.description
    } as InputEnumTypeValue;
}

export function fromUsageFlags(usage: UsageFlags): Usage {
    if (usage === UsageFlags.Input) return Usage.Input;
    else if (usage === UsageFlags.Output) return Usage.Output;
    else if (usage === (UsageFlags.Input | UsageFlags.Output))
        return Usage.RoundTrip;
    else return Usage.None;
}
