// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Samples
{
    /// <summary>
    /// Generates mock <see cref="InputOperationExample"/> instances for operations
    /// that don't have examples provided in the spec.
    /// </summary>
    public static class ExampleMockValueBuilder
    {
        /// <summary>
        /// Example key for the variant that includes only required parameters.
        /// </summary>
        public const string ShortVersionKey = "ShortVersion";

        /// <summary>
        /// Example key for the variant that includes all parameters.
        /// </summary>
        public const string AllParametersKey = "AllParameters";

        private const string DefaultEndpointValue = "http://localhost:3000";

        /// <summary>
        /// Builds mock operation examples for the given operation.
        /// Produces two variants: "ShortVersion" (required params only) and "AllParameters" (all params).
        /// </summary>
        public static IReadOnlyList<InputOperationExample> BuildOperationExamples(InputOperation operation)
        {
            return new[]
            {
                BuildOperationExample(operation, ShortVersionKey, useAllParameters: false),
                BuildOperationExample(operation, AllParametersKey, useAllParameters: true)
            };
        }

        private static InputOperationExample BuildOperationExample(InputOperation operation, string name, bool useAllParameters)
        {
            var parameterExamples = new List<InputParameterExample>(operation.Parameters.Count);
            foreach (var parameter in operation.Parameters)
            {
                if (!useAllParameters && !parameter.IsRequired)
                {
                    continue;
                }
                var parameterExample = BuildParameterExample(parameter, useAllParameters);
                parameterExamples.Add(parameterExample);
            }

            return new InputOperationExample(name, null, parameterExamples, string.Empty);
        }

        /// <summary>
        /// Builds a mock example value for a single parameter.
        /// </summary>
        internal static InputParameterExample BuildParameterExample(InputParameter parameter, bool useAllParameters)
        {
            // Constant parameters use their constant value directly
            if (parameter.Scope == InputParameterScope.Constant)
            {
                var value = GetConstantValue(parameter);
                return new InputParameterExample(parameter, value);
            }

            // Endpoint parameters use a mock URL
            if (parameter is InputEndpointParameter { IsEndpoint: true })
            {
                var value = InputExampleValue.Value(parameter.Type, DefaultEndpointValue);
                return new InputParameterExample(parameter, value);
            }

            // Parameters with default values use those
            if (parameter.DefaultValue != null)
            {
                var value = InputExampleValue.Value(parameter.Type, parameter.DefaultValue.Value);
                return new InputParameterExample(parameter, value);
            }

            // Everything else: generate a mock value based on the type
            var exampleValue = BuildExampleValue(parameter.Type, parameter.Name, useAllParameters, new HashSet<InputModelType>());
            return new InputParameterExample(parameter, exampleValue);
        }

        private static InputExampleValue GetConstantValue(InputParameter parameter)
        {
            if (parameter.Type is InputLiteralType { Value: not null } literal)
            {
                return InputExampleValue.Value(parameter.Type, literal.Value);
            }
            if (parameter.DefaultValue != null)
            {
                return InputExampleValue.Value(parameter.Type, parameter.DefaultValue.Value);
            }
            if (parameter.Type is InputUnionType unionType && unionType.VariantTypes[0] is InputLiteralType literalVariant)
            {
                return InputExampleValue.Value(parameter.Type, literalVariant.Value);
            }
            if (parameter.Type is InputEnumType enumType && enumType.Values.Count > 0)
            {
                return InputExampleValue.Value(parameter.Type, enumType.Values[0].Value);
            }
            return InputExampleValue.Null(parameter.Type);
        }

        /// <summary>
        /// Builds a mock example value for the given input type.
        /// This is the main dispatch method that handles all type kinds.
        /// </summary>
        internal static InputExampleValue BuildExampleValue(InputType type, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels) => type switch
        {
            InputArrayType arrayType => BuildListExampleValue(arrayType, hint, useAllParameters, visitedModels),
            InputDictionaryType dictType => BuildDictionaryExampleValue(dictType, hint, useAllParameters, visitedModels),
            InputEnumType enumType => BuildEnumExampleValue(enumType),
            InputPrimitiveType primitiveType => BuildPrimitiveExampleValue(primitiveType, hint),
            InputLiteralType literalType => InputExampleValue.Value(literalType, literalType.Value),
            InputModelType modelType => BuildModelExampleValue(modelType, useAllParameters, visitedModels),
            InputUnionType unionType => BuildExampleValue(unionType.VariantTypes[0], hint, useAllParameters, visitedModels),
            InputNullableType nullableType => BuildExampleValue(nullableType.Type, hint, useAllParameters, visitedModels),
            InputDateTimeType dateTimeType => BuildDateTimeExampleValue(dateTimeType),
            InputDurationType durationType => BuildDurationExampleValue(durationType),
            _ => InputExampleValue.Object(type, new Dictionary<string, InputExampleValue>())
        };

        private static InputExampleValue BuildListExampleValue(InputArrayType arrayType, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            var elementValue = BuildExampleValue(arrayType.ValueType, hint, useAllParameters, visitedModels);
            return InputExampleValue.List(arrayType, new[] { elementValue });
        }

        private static InputExampleValue BuildDictionaryExampleValue(InputDictionaryType dictType, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            var valueExample = BuildExampleValue(dictType.ValueType, hint, useAllParameters, visitedModels);
            return InputExampleValue.Object(dictType, new Dictionary<string, InputExampleValue>
            {
                ["key"] = valueExample
            });
        }

        private static InputExampleValue BuildEnumExampleValue(InputEnumType enumType)
        {
            var firstValue = enumType.Values.FirstOrDefault();
            return firstValue != null
                ? InputExampleValue.Value(enumType, firstValue.Value)
                : InputExampleValue.Null(enumType);
        }

        private static InputExampleValue BuildPrimitiveExampleValue(InputPrimitiveType primitiveType, string? hint) => primitiveType.Kind switch
        {
            InputPrimitiveTypeKind.Boolean => InputExampleValue.Value(primitiveType, true),
            InputPrimitiveTypeKind.Int8 => InputExampleValue.Value(primitiveType, (sbyte)123),
            InputPrimitiveTypeKind.UInt8 => InputExampleValue.Value(primitiveType, (byte)123),
            InputPrimitiveTypeKind.Int16 => InputExampleValue.Value(primitiveType, (short)1234),
            InputPrimitiveTypeKind.Int32 or InputPrimitiveTypeKind.Integer => InputExampleValue.Value(primitiveType, 1234),
            InputPrimitiveTypeKind.Int64 or InputPrimitiveTypeKind.SafeInt => InputExampleValue.Value(primitiveType, 1234L),
            InputPrimitiveTypeKind.UInt16 => InputExampleValue.Value(primitiveType, (ushort)1234),
            InputPrimitiveTypeKind.UInt32 => InputExampleValue.Value(primitiveType, (uint)1234),
            InputPrimitiveTypeKind.UInt64 => InputExampleValue.Value(primitiveType, (ulong)1234),
            InputPrimitiveTypeKind.Float32 or InputPrimitiveTypeKind.Float => InputExampleValue.Value(primitiveType, 123.45f),
            InputPrimitiveTypeKind.Float64 or InputPrimitiveTypeKind.Numeric => InputExampleValue.Value(primitiveType, 123.45),
            InputPrimitiveTypeKind.Decimal or InputPrimitiveTypeKind.Decimal128 => InputExampleValue.Value(primitiveType, 123.45m),
            InputPrimitiveTypeKind.String => BuildStringExampleValue(primitiveType, hint),
            InputPrimitiveTypeKind.Url => InputExampleValue.Value(primitiveType, "http://localhost:3000"),
            InputPrimitiveTypeKind.PlainDate => InputExampleValue.Value(primitiveType, "2022-05-10"),
            InputPrimitiveTypeKind.PlainTime => InputExampleValue.Value(primitiveType, "01:23:45"),
            InputPrimitiveTypeKind.Stream => InputExampleValue.Stream(primitiveType, "<filePath>"),
            InputPrimitiveTypeKind.Bytes => InputExampleValue.Value(primitiveType, "dGVzdA=="), // base64 for "test"
            _ => InputExampleValue.Object(primitiveType, new Dictionary<string, InputExampleValue>())
        };

        private static InputExampleValue BuildStringExampleValue(InputPrimitiveType primitiveType, string? hint)
        {
            // UUID-typed strings get a mock UUID
            if (primitiveType.Encode == "uuid")
            {
                return InputExampleValue.Value(primitiveType, "73f411fe-4f43-4b4b-9cbd-6828d8f4cf9a");
            }

            return string.IsNullOrWhiteSpace(hint)
                ? InputExampleValue.Value(primitiveType, "<String>")
                : InputExampleValue.Value(primitiveType, $"<{hint}>");
        }

        private static InputExampleValue BuildDateTimeExampleValue(InputDateTimeType dateTimeType)
        {
            if (dateTimeType.Encode == DateTimeKnownEncoding.Rfc7231)
                return InputExampleValue.Value(dateTimeType.WireType, "Tue, 10 May 2022 18:57:31 GMT");
            if (dateTimeType.Encode == DateTimeKnownEncoding.Rfc3339)
                return InputExampleValue.Value(dateTimeType.WireType, "2022-05-10T18:57:31.2311892Z");
            if (dateTimeType.Encode == DateTimeKnownEncoding.UnixTimestamp)
                return InputExampleValue.Value(dateTimeType.WireType, 1652209051);

            return InputExampleValue.Null(dateTimeType);
        }

        private static InputExampleValue BuildDurationExampleValue(InputDurationType durationType)
        {
            if (durationType.Encode == DurationKnownEncoding.Iso8601)
                return InputExampleValue.Value(durationType.WireType, "PT1H23M45S");

            if (durationType.Encode == DurationKnownEncoding.Seconds)
            {
                return durationType.WireType.Kind switch
                {
                    InputPrimitiveTypeKind.Int32 => InputExampleValue.Value(durationType.WireType, 10),
                    InputPrimitiveTypeKind.Float or InputPrimitiveTypeKind.Float32 => InputExampleValue.Value(durationType.WireType, 10f),
                    _ => InputExampleValue.Value(durationType.WireType, 3.141592)
                };
            }

            return InputExampleValue.Null(durationType);
        }

        private static InputExampleValue BuildModelExampleValue(InputModelType model, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            // Cycle detection: if we've already visited this model, return null to break the loop
            if (visitedModels.Contains(model))
                return InputExampleValue.Null(model);

            var properties = new Dictionary<string, InputExampleValue>();
            var result = InputExampleValue.Object(model, properties);
            visitedModels.Add(model);

            // If this model has a discriminator, choose the first derived type
            if (model.DiscriminatorProperty != null && model.DerivedModels.Count > 0)
            {
                var derived = model.DerivedModels.FirstOrDefault(m => !m.IsUnknownDiscriminatorModel);
                if (derived != null)
                {
                    model = derived;
                }
                else
                {
                    return InputExampleValue.Null(model);
                }
            }

            // Iterate all properties from this model and its base models
            foreach (var modelInChain in model.GetSelfAndBaseModels())
            {
                foreach (var property in modelInChain.Properties)
                {
                    // Skip read-only properties (they can't be set)
                    if (property.IsReadOnly)
                        continue;

                    // In ShortVersion, skip optional properties
                    if (!useAllParameters && !property.IsRequired)
                        continue;

                    // Skip duplicate properties (keep the one from the most-derived type)
                    if (properties.ContainsKey(property.SerializedName))
                        continue;

                    InputExampleValue exampleValue;
                    if (property.IsDiscriminator && model.DiscriminatorValue != null)
                    {
                        exampleValue = InputExampleValue.Value(property.Type, model.DiscriminatorValue);
                    }
                    else if (property.DefaultValue is { Value: not null } defaultValue)
                    {
                        exampleValue = InputExampleValue.Value(property.Type, defaultValue.Value);
                    }
                    else
                    {
                        exampleValue = BuildExampleValue(property.Type, property.SerializedName, useAllParameters, visitedModels);
                    }

                    properties.Add(property.SerializedName, exampleValue);
                }
            }

            return result;
        }
    }
}
