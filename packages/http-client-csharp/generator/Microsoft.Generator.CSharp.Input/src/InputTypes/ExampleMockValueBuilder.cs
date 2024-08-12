// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.Generator.CSharp.Input
{
    internal class ExampleMockValueBuilder
    {
        public const string ShortVersionMockExampleKey = "ShortVersion";
        public const string MockExampleAllParameterKey = "AllParameters";

        // TO-DO: Remove dependency on Configuration class and replace with the actual mock endpoint value https://github.com/Azure/autorest.csharp/issues/4227
        private static readonly string EndpointMockValue = "mockValue"; // Configuration.Instance.ApiTypes.EndPointSampleValue;

        private static readonly ConcurrentDictionary<InputType, InputExampleValue> _cache = new();

        public static InputClientExample BuildClientExample(InputClient client, bool useAllParameters)
        {
            _cache.Clear();
            var clientParameterExamples = new List<InputParameterExample>();
            foreach (var parameter in client.Parameters)
            {
                if (!useAllParameters && !parameter.IsRequired)
                {
                    continue;
                }
                var parameterExample = BuildParameterExample(parameter, useAllParameters);
                clientParameterExamples.Add(parameterExample);
            }

            return new(client, clientParameterExamples);
        }

        internal static InputOperationExample BuildOperationExample(InputOperation operation, bool useAllParameters)
        {
            _cache.Clear();

            var parameterExamples = new List<InputParameterExample>();
            foreach (var parameter in operation.Parameters)
            {
                if (!useAllParameters && !parameter.IsRequired)
                {
                    continue;
                }
                var parameterExample = BuildParameterExample(parameter, useAllParameters);
                parameterExamples.Add(parameterExample);
            }

            return new(operation, parameterExamples);
        }

        private static InputParameterExample BuildParameterExample(InputParameter parameter, bool useAllParameters)
        {
            // if the parameter is constant, we just put the constant into the example value instead of mocking a new one
            if (parameter.Kind == InputOperationParameterKind.Constant)
            {
                InputExampleValue value;
                if (parameter is { Type: InputLiteralType { Value: { } literalValue } })
                {
                    // when it is literal type, we just use the value
                    value = InputExampleValue.Value(parameter.Type, literalValue);
                }
                else if (parameter.Type is InputUnionType unionType && unionType.VariantTypes[0] is InputLiteralType literalType)
                {
                    // or it could be a union of literal types
                    value = InputExampleValue.Value(parameter.Type, literalType.Value);
                }
                else if (parameter.Type is InputEnumType enumType && enumType.Values[0].Value is { } enumValue)
                {
                    // or it could be an enum of a few values
                    value = InputExampleValue.Value(parameter.Type, enumValue);
                }
                else
                {
                    // fallback to null
                    value = InputExampleValue.Null(parameter.Type);
                }
                return new(parameter, value);
            }

            // if the parameter is endpoint
            if (parameter.IsEndpoint)
            {
                var value = InputExampleValue.Value(parameter.Type, EndpointMockValue);
                return new(parameter, value);
            }

            if (parameter.DefaultValue != null)
            {
                var value = InputExampleValue.Value(parameter.Type, parameter.DefaultValue.Value);
                return new(parameter, value);
            }

            var exampleValue = BuildExampleValue(parameter.Type, parameter.Name, useAllParameters, new HashSet<InputModelType>());
            return new(parameter, exampleValue);
        }

        private static InputExampleValue BuildExampleValue(InputType type, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels) => type switch
        {
            InputArrayType listType => BuildListExampleValue(listType, hint, useAllParameters, visitedModels),
            InputDictionaryType dictionaryType => BuildDictionaryExampleValue(dictionaryType, hint, useAllParameters, visitedModels),
            InputEnumType enumType => BuildEnumExampleValue(enumType),
            InputPrimitiveType primitiveType => BuildPrimitiveExampleValue(primitiveType, hint),
            InputLiteralType literalType => InputExampleValue.Value(literalType, literalType.Value),
            InputModelType modelType => BuildModelExampleValue(modelType, useAllParameters, visitedModels),
            InputUnionType unionType => BuildExampleValue(unionType.VariantTypes[0], hint, useAllParameters, visitedModels),
            InputDateTimeType dateTimeType => BuildDateTimeExampleValue(dateTimeType),
            InputDurationType durationType => BuildDurationExampleValue(durationType),
            InputNullableType nullableType => BuildExampleValue(nullableType.Type, hint, useAllParameters, visitedModels),
            _ => InputExampleValue.Object(type, new Dictionary<string, InputExampleValue>())
        };

        private static InputExampleValue BuildListExampleValue(InputArrayType listType, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            var exampleElementValue = BuildExampleValue(listType.ValueType, hint, useAllParameters, visitedModels);

            return InputExampleValue.List(listType, new[] { exampleElementValue });
        }

        private static InputExampleValue BuildDictionaryExampleValue(InputDictionaryType dictionaryType, string? hint, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            var exampleValue = BuildExampleValue(dictionaryType.ValueType, hint, useAllParameters, visitedModels);

            return InputExampleValue.Object(dictionaryType, new Dictionary<string, InputExampleValue>
            {
                ["key"] = exampleValue
            });
        }

        private static InputExampleValue BuildEnumExampleValue(InputEnumType enumType)
        {
            var enumValue = enumType.Values[0];
            return InputExampleValue.Value(enumType, enumValue.Value);
        }

        private static InputExampleValue BuildPrimitiveExampleValue(InputPrimitiveType primitiveType, string? hint) => primitiveType.Kind switch
        {
            InputPrimitiveTypeKind.Stream => InputExampleValue.Stream(primitiveType, "<filePath>"),
            InputPrimitiveTypeKind.Boolean => InputExampleValue.Value(primitiveType, true),
            InputPrimitiveTypeKind.PlainDate => InputExampleValue.Value(primitiveType, "2022-05-10"),
            InputPrimitiveTypeKind.Float32 => InputExampleValue.Value(primitiveType, 123.45f),
            InputPrimitiveTypeKind.Float64 => InputExampleValue.Value(primitiveType, 123.45d),
            InputPrimitiveTypeKind.Int8 => InputExampleValue.Value(primitiveType, (sbyte)123),
            InputPrimitiveTypeKind.UInt8 => InputExampleValue.Value(primitiveType, (byte)123),
            InputPrimitiveTypeKind.Int32 => InputExampleValue.Value(primitiveType, 1234),
            InputPrimitiveTypeKind.Int64 => InputExampleValue.Value(primitiveType, 1234L),
            InputPrimitiveTypeKind.SafeInt => InputExampleValue.Value(primitiveType, 1234L),
            InputPrimitiveTypeKind.String => string.IsNullOrWhiteSpace(hint) ? InputExampleValue.Value(primitiveType, "<String>") : InputExampleValue.Value(primitiveType, $"<{hint}>"),
            InputPrimitiveTypeKind.PlainTime => InputExampleValue.Value(primitiveType, "01:23:45"),
            InputPrimitiveTypeKind.Url => InputExampleValue.Value(primitiveType, "http://localhost:3000"),
            _ => InputExampleValue.Object(primitiveType, new Dictionary<string, InputExampleValue>())
        };

        private static InputExampleValue BuildDateTimeExampleValue(InputDateTimeType dateTimeType) => dateTimeType.Encode switch
        {
            DateTimeKnownEncoding.Rfc7231 => InputExampleValue.Value(dateTimeType.WireType, "Tue, 10 May 2022 18:57:31 GMT"),
            DateTimeKnownEncoding.Rfc3339 => InputExampleValue.Value(dateTimeType.WireType, "2022-05-10T18:57:31.2311892Z"),
            DateTimeKnownEncoding.UnixTimestamp => InputExampleValue.Value(dateTimeType.WireType, 1652209051),
            _ => InputExampleValue.Null(dateTimeType)
        };

        private static InputExampleValue BuildDurationExampleValue(InputDurationType durationType) => durationType.Encode switch
        {
            DurationKnownEncoding.Iso8601 => InputExampleValue.Value(durationType.WireType, "PT1H23M45S"),
            DurationKnownEncoding.Seconds => durationType.WireType.Kind switch
            {
                InputPrimitiveTypeKind.Int32 => InputExampleValue.Value(durationType.WireType, 10),
                InputPrimitiveTypeKind.Float or InputPrimitiveTypeKind.Float32 => InputExampleValue.Value(durationType.WireType, 10f),
                _ => InputExampleValue.Value(durationType.WireType, 3.141592)
            },
            _ => InputExampleValue.Null(durationType)
        };

        private static InputExampleValue BuildModelExampleValue(InputModelType model, bool useAllParameters, HashSet<InputModelType> visitedModels)
        {
            if (visitedModels.Contains(model))
                return InputExampleValue.Null(model);

            var dict = new Dictionary<string, InputExampleValue>();
            var result = InputExampleValue.Object(model, dict);
            visitedModels.Add(model);
            // if this model has a discriminator, we should return a derived type
            if (model.DiscriminatorProperty != null)
            {
                var derived = model.DiscriminatedSubtypes.Values.FirstOrDefault();
                if (derived is null)
                {
                    return InputExampleValue.Null(model);
                }
                else
                {
                    model = derived;
                }
            }
            // then, we just iterate all the properties
            foreach (var modelOrBase in model.GetSelfAndBaseModels())
            {
                foreach (var property in modelOrBase.Properties)
                {
                    if (property.IsReadOnly)
                        continue;

                    if (!useAllParameters && !property.IsRequired)
                        continue;

                    // this means a property is defined both on the base and derived type, we skip other occurrences only keep the first
                    // which means we only keep the property defined in the lowest layer (derived types)
                    if (dict.ContainsKey(property.SerializedName))
                        continue;

                    InputExampleValue exampleValue;
                    if (property.IsDiscriminator)
                    {
                        exampleValue = InputExampleValue.Value(property.Type, model.DiscriminatorValue!);
                    }
                    else
                    {
                        exampleValue = BuildExampleValue(property.Type, property.SerializedName, useAllParameters, visitedModels);
                    }

                    dict.Add(property.SerializedName, exampleValue);
                }
            }

            return result;
        }
    }
}
