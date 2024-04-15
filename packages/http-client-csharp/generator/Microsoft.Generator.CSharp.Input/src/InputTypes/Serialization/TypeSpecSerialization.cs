// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    public static class TypeSpecSerialization
    {
        public static InputNamespace? Deserialize(string json)
        {
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                ReferenceHandler = referenceHandler,
                AllowTrailingCommas = true
            };

            options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
            options.Converters.Add(new TypeSpecInputTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputListTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputDictionaryTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputEnumTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputEnumTypeValueConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputModelTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputModelPropertyConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputConstantConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputLiteralTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputUnionTypeConverter(referenceHandler));
            options.Converters.Add(new TypeSpecInputParameterConverter(referenceHandler));
            return JsonSerializer.Deserialize<InputNamespace>(json, options);
        }
    }
}
