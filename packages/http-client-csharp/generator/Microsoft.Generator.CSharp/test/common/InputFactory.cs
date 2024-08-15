// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Tests.Common
{
    public static class InputFactory
    {
        public static InputModelProperty Property(string name, InputType type, bool isRequired = false, bool isReadOnly = false, bool isDiscriminator = false)
        {
            return new InputModelProperty(
                name,
                name.ToVariableName(),
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
                null,
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
