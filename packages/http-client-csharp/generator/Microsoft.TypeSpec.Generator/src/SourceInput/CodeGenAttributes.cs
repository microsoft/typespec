// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    public static class CodeGenAttributes
    {
        public const string CodeGenSuppressAttributeName = "CodeGenSuppressAttribute";

        public const string CodeGenMemberAttributeName = "CodeGenMemberAttribute";

        public const string CodeGenTypeAttributeName = "CodeGenTypeAttribute";

        public const string CodeGenSerializationAttributeName = "CodeGenSerializationAttribute";

        private const string PropertySerializationName = "PropertySerializationName";

        private const string SerializationValueHook = "SerializationValueHook";

        private const string DeserializationValueHook = "DeserializationValueHook";

        internal static bool TryGetCodeGenMemberAttributeValue(AttributeData attributeData, [MaybeNullWhen(false)] out string name)
        {
            name = null;
            if (attributeData.AttributeClass?.Name != CodeGenMemberAttributeName)
                return false;

            name = attributeData.ConstructorArguments.FirstOrDefault().Value as string;
            return name != null;
        }

        public static bool TryGetCodeGenSerializationAttributeValue(AttributeStatement attribute, [MaybeNullWhen(false)] out string propertyName, out string? serializationName, out string? serializationHook, out string? deserializationHook, out string? bicepSerializationHook)
        {
            propertyName = null;
            serializationName = null;
            serializationHook = null;
            deserializationHook = null;
            bicepSerializationHook = null;
            var attributeData = attribute.Data;
            if (attributeData!.AttributeClass?.Name != CodeGenSerializationAttributeName)
            {
                return false;
            }

            var ctorArgs = attributeData.ConstructorArguments;
            // this attribute could only at most have one constructor
            propertyName = ctorArgs[0].Value as string;

            if (ctorArgs.Length > 1)
            {
                var namesArg = ctorArgs[1];
                serializationName = namesArg.Kind switch
                {
                    _ when namesArg.IsNull => null,
                    _ => namesArg.Value?.ToString()!
                };
            }

            foreach (var (key, namedArgument) in attributeData.NamedArguments)
            {
                switch (key)
                {
                    case nameof(PropertySerializationName):
                        serializationName = namedArgument.Value as string;
                        break;
                    case nameof(SerializationValueHook):
                        serializationHook = namedArgument.Value as string;
                        break;
                    case nameof(DeserializationValueHook):
                        deserializationHook = namedArgument.Value as string;
                        break;
                }
            }

            return propertyName != null && (serializationName != null || serializationHook != null || deserializationHook != null || bicepSerializationHook != null);
        }

        private static string[]? ToStringArray(ImmutableArray<TypedConstant> values)
        {
            if (values.IsDefaultOrEmpty)
            {
                return null;
            }

            return values
                .Select(v => (string?)v.Value)
                .OfType<string>()
                .ToArray();
        }
    }
}
