// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

        private const string DefaultEndpointValue = "<endpoint>";

        /// <summary>
        /// Builds mock operation examples for the given operation.
        /// Produces two variants: "ShortVersion" (required params only) and "AllParameters" (all params).
        /// If all parameters are required, only "AllParameters" is produced since both would be identical.
        /// </summary>
        public static IReadOnlyList<InputOperationExample> BuildOperationExamples(InputOperation operation)
        {
            return
            [
                BuildOperationExample(operation, ShortVersionKey, useAllParameters: false),
                BuildOperationExample(operation, AllParametersKey, useAllParameters: true)
            ];
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
            InputDateTimeType dateTimeType => BuildPrimitiveExampleValue(dateTimeType.WireType, hint ?? dateTimeType.Encode.ToString()),
            InputDurationType durationType => BuildPrimitiveExampleValue(durationType.WireType, hint ?? durationType.Encode.ToString()),
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

        private static InputExampleValue BuildPrimitiveExampleValue(InputPrimitiveType primitiveType, string? hint) => primitiveType switch
        {
            { Kind: InputPrimitiveTypeKind.Boolean } => InputExampleValue.Value(primitiveType, true),
            { IsNumber: true } => InputExampleValue.Value(primitiveType, 0),
            { Kind: InputPrimitiveTypeKind.Stream } => InputExampleValue.Stream(primitiveType, "<filePath>"),
            _ => BuildStringExampleValue(primitiveType, hint ?? primitiveType.Kind.ToString())
        };

        private static InputExampleValue BuildStringExampleValue(InputPrimitiveType primitiveType, string? hint)
        {
            if (primitiveType.Encode == "uuid")
            {
                return InputExampleValue.Value(primitiveType, "<uuid>");
            }

            return string.IsNullOrWhiteSpace(hint)
                ? InputExampleValue.Value(primitiveType, "<String>")
                : InputExampleValue.Value(primitiveType, $"<{hint}>");
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
