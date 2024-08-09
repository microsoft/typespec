// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Common.Input;

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
                AllowTrailingCommas = true,
                Converters =
                {
                    new TypeSpecInputNamespaceConverter(referenceHandler),
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new TypeSpecInputTypeConverter(referenceHandler),
                    new TypeSpecInputArrayTypeConverter(referenceHandler),
                    new TypeSpecInputDictionaryTypeConverter(referenceHandler),
                    new TypeSpecInputEnumTypeConverter(referenceHandler),
                    new TypeSpecInputEnumTypeValueConverter(referenceHandler),
                    new TypeSpecInputModelTypeConverter(referenceHandler),
                    new TypeSpecInputModelPropertyConverter(referenceHandler),
                    new TypeSpecInputConstantConverter(referenceHandler),
                    new TypeSpecInputLiteralTypeConverter(referenceHandler),
                    new TypeSpecInputUnionTypeConverter(referenceHandler),
                    new TypeSpecInputClientConverter(referenceHandler),
                    new TypeSpecInputOperationConverter(referenceHandler),
                    new TypeSpecInputParameterConverter(referenceHandler),
                    new TypeSpecInputPrimitiveTypeConverter(referenceHandler),
                    new TypeSpecOperationLongRunningConverter(referenceHandler),
                    new TypeSpecOperationResponseConverter(referenceHandler),
                    new TypeSpecOperationResponseHeaderConverter(referenceHandler),
                    new TypeSpecInputDateTimeTypeConverter(referenceHandler),
                    new TypeSpecInputDurationTypeConverter(referenceHandler),
                    new TypeSpecInputAuthConverter(referenceHandler),
                    new TypeSpecInputDecoratorInfoConverter(referenceHandler),
                }
            };

            return JsonSerializer.Deserialize<InputNamespace>(json, options);
        }
    }
}
