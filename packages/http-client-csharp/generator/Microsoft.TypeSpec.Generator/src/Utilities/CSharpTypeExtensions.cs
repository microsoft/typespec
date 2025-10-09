// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class CSharpTypeExtensions
    {
        public static CSharpType ApplyInputSpecProperty(this CSharpType type, InputProperty? specProperty)
        {
            if (type.IsCollection)
            {
                var elementType = type.ElementType.ApplyInputSpecProperty(specProperty);
                if (type.IsList)
                {
                    type = new CSharpType(type.FrameworkType, [elementType], type.IsNullable);
                }
                else if (type.IsDictionary)
                {
                    type = new CSharpType(type.FrameworkType, [type.Arguments[0], elementType], type.IsNullable);
                }
            }

            // Ensure the namespace is populated for properties that customize generated model/enum types
            // The namespaces are not able to be resolved by Roslyn since the generated types are not part of the compilation.
            type = EnsureNamespace(specProperty, type);

            // handle customized enums - we need to pull the type information from the spec property
            type = EnsureEnum(specProperty, type);

            // ensure literal types are correctly represented in the custom field using the info from the spec property
            type = EnsureLiteral(specProperty, type);

            return type;
        }

        private static CSharpType EnsureNamespace(InputProperty? specProperty, CSharpType type)
        {
            if (string.IsNullOrEmpty(type.Namespace))
            {
                InputType? inputType = GetInputModelType(specProperty?.Type);
                if (inputType == null)
                {
                    inputType = GetInputEnumType(specProperty?.Type);
                }

                if (inputType == null)
                {
                    return type;
                }

                // Use the TypeFactory to get the correct namespace for the type which respects any customizations that have
                // been applied to the generated types.
                var newType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputType);
                if (newType != null)
                {
                    return newType;
                }
            }

            return type;
        }

        private static bool IsCustomizedEnumProperty(
            InputProperty? inputProperty,
            CSharpType customType,
            [NotNullWhen(true)] out InputType? specValueType)
        {
            var enumValueType = GetInputPrimitiveType(inputProperty?.Type);
            if (enumValueType != null)
            {
                specValueType = enumValueType;
                return true;
            }
            if (customType.IsEnum && inputProperty != null)
            {
                specValueType = inputProperty.Type is InputNullableType nullableType ? nullableType.Type : inputProperty.Type;
                return true;
            }
            specValueType = null;
            return false;
        }

        private static CSharpType EnsureLiteral(InputProperty? specProperty, CSharpType customType)
        {
            if (customType is { IsFrameworkType: false, IsEnum: false })
            {
                return customType;
            }

            if (specProperty?.Type is InputLiteralType inputLiteral)
            {
                return CSharpType.FromLiteral(customType, inputLiteral.Value);
            }

            if (specProperty?.Type is InputEnumTypeValue inputEnumValue)
            {
                return CSharpType.FromLiteral(customType, inputEnumValue.Value);
            }

            return customType;
        }

        private static CSharpType EnsureEnum(InputProperty? specProperty, CSharpType customType)
        {
            if (!customType.IsFrameworkType && IsCustomizedEnumProperty(specProperty, customType, out var specType))
            {
                if (specType is InputLiteralType literalType)
                {
                    specType = literalType.ValueType;
                }
                return new CSharpType(
                    customType.Name,
                    customType.Namespace,
                    customType.IsValueType,
                    customType.IsNullable,
                    customType.DeclaringType,
                    customType.Arguments,
                    customType.IsPublic,
                    customType.IsStruct,
                    customType.BaseType,
                    TypeFactory.CreatePrimitiveCSharpTypeCore(specType));
            }
            return customType;
        }

        private static InputPrimitiveType? GetInputPrimitiveType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputPrimitiveType(nullableType.Type),
                InputEnumTypeValue enumValueType => enumValueType.ValueType,
                InputEnumType enumType => enumType.ValueType,
                InputLiteralType inputLiteral => inputLiteral.ValueType,
                InputArrayType arrayType => GetInputPrimitiveType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputPrimitiveType(dictionaryType.ValueType),
                _ => null
            };
        }

        private static InputEnumType? GetInputEnumType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputEnumType(nullableType.Type),
                InputEnumType enumType => enumType,
                InputEnumTypeValue enumValueType => enumValueType.EnumType,
                InputArrayType arrayType => GetInputEnumType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputEnumType(dictionaryType.ValueType),
                _ => null
            };
        }

        private static InputModelType? GetInputModelType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputModelType(nullableType.Type),
                InputModelType modelType => modelType,
                InputArrayType arrayType => GetInputModelType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputModelType(dictionaryType.ValueType),
                _ => null
            };
        }
    }
}
