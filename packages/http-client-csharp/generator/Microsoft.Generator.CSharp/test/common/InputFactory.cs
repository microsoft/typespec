// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Tests.Common
{
    public static class InputFactory
    {
        public static class EnumMember
        {
            public static InputEnumTypeValue Int32(string name, int value)
            {
                return new InputEnumTypeValue(name, value, $"{name} description");
            }

            public static InputEnumTypeValue Float32(string name, float value)
            {
                return new InputEnumTypeValue(name, value, $"{name} description");
            }

            public static InputEnumTypeValue String(string name, string value)
            {
                return new InputEnumTypeValue(name, value, $"{name} description");
            }
        }

        public static InputParameter Parameter(
            string name,
            InputType type,
            RequestLocation location = RequestLocation.Body,
            bool isRequred = false,
            InputOperationParameterKind kind = InputOperationParameterKind.Method)
        {
            return new InputParameter(
                name,
                name,
                $"{name} description",
                type,
                location,
                null,
                kind,
                isRequred,
                false,
                false,
                false,
                false,
                false,
                false,
                null,
                null);
        }

        public static InputNamespace Namespace(string name, IEnumerable<InputModelType>? models = null)
        {
            return new InputNamespace(
                name,
                [],
                [],
                models is null ? [] : [.. models],
                [],
                new InputAuth());
        }

        public static InputEnumType Enum(
            string name,
            InputPrimitiveType underlyingType,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Output | InputModelTypeUsage.Input,
            IEnumerable<InputEnumTypeValue>? values = null,
            bool isExtensible = false)
        {
            return new InputEnumType(
                name,
                name,
                access,
                null,
                $"{name} description",
                usage,
                underlyingType,
                values is null ? [new InputEnumTypeValue("Value", 1, "Value description")] : [.. values],
                isExtensible);
        }

        public static InputModelProperty Property(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isDiscriminator = false,
            string? wireName = null)
        {
            return new InputModelProperty(
                name,
                wireName ?? name.ToVariableName(),
                $"Description for {name}",
                type,
                isRequired,
                isReadOnly,
                isDiscriminator,
                null);
        }

        public static InputModelType Model(
            string name,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Output | InputModelTypeUsage.Input,
            IEnumerable<InputModelProperty>? properties = null,
            InputModelType? baseModel = null,
            bool modelAsStruct = false)
        {
            return new InputModelType(
                name,
                name,
                access,
                null,
                $"{name} description",
                usage,
                properties is null ? [InputFactory.Property("StringProperty", InputPrimitiveType.String)] : [.. properties],
                baseModel,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                modelAsStruct);
        }

        public static InputType Array(InputType elementType)
        {
            return new InputArrayType("list", "list", elementType);
        }

        public static InputType Dictionary(InputType valueType, InputType? keyType = null)
        {
            return new InputDictionaryType("dictionary", keyType ?? InputPrimitiveType.String, valueType);
        }
    }
}
