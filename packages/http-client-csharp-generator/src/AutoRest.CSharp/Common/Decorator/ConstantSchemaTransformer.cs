// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Input;

namespace AutoRest.CSharp.Common.Decorator
{
    internal static class ConstantSchemaTransformer
    {
        public static void Transform(CodeModel codeModel)
        {
            var constantSchemas = new HashSet<ConstantSchema>(codeModel.Schemas.Constants);
            if (!constantSchemas.Any())
                return;

            Dictionary<ConstantSchema, ChoiceSchema> convertedChoiceSchemas = new();

            foreach (var operation in codeModel.OperationGroups.SelectMany(og => og.Operations))
            {
                // change the schema on operations (only for optional)
                foreach (var parameter in operation.Parameters)
                {
                    if (parameter.IsRequired || parameter.Schema is not ConstantSchema constantSchema || ShouldSkipReplace(constantSchema))
                        continue;

                    var choiceSchema = ComputeIfAbsent(convertedChoiceSchemas, constantSchema, ConvertToChoiceSchema);
                    constantSchema.ValueType = choiceSchema;
                    operation.SignatureParameters.Add(parameter);
                }

                foreach (var request in operation.Requests)
                {
                    foreach (var parameter in request.Parameters)
                    {
                        if (parameter.IsRequired || parameter.Schema is not ConstantSchema constantSchema || ShouldSkipReplace(constantSchema))
                            continue;

                        var choiceSchema = ComputeIfAbsent(convertedChoiceSchemas, constantSchema, ConvertToChoiceSchema);
                        constantSchema.ValueType = choiceSchema;
                        request.SignatureParameters.Add(parameter);
                    }
                }

                // change the schema on models (optional and required)
                foreach (var obj in codeModel.Schemas.Objects)
                {
                    foreach (var property in obj.Properties)
                    {
                        if (property.Schema is not ConstantSchema constantSchema || ShouldSkipReplace(constantSchema) || CheckPropertyExtension(property))
                            continue;

                        var choiceSchema = ComputeIfAbsent(convertedChoiceSchemas, constantSchema, ConvertToChoiceSchema);
                        constantSchema.ValueType = choiceSchema;
                    }
                }
            }

            foreach (var choiceSchema in convertedChoiceSchemas.Values)
                codeModel.Schemas.Choices.Add(choiceSchema);
        }

        // we skip this process when the underlying type of the constant is boolean
        private static bool ShouldSkipReplace(ConstantSchema constantSchema)
            => constantSchema.ValueType is BooleanSchema;

        private static bool CheckPropertyExtension(Property property)
        {
            if (property.Extensions?.TryGetValue("x-ms-constant", out var value) ?? false)
            {
                return "true".Equals(value.ToString());
            }
            return false;
        }

        private static V ComputeIfAbsent<K, V>(Dictionary<K, V> dict, K key, Func<K, V> generator) where K : notnull
        {
            if (dict.TryGetValue(key, out var value))
            {
                return value;
            }
            var generated = generator(key);
            dict.Add(key, generated);
            return generated;
        }

        private static ChoiceSchema ConvertToChoiceSchema(ConstantSchema constantSchema)
        {
            var choiceValue = constantSchema.Value.Value.ToString();
            ChoiceValue choice = new()
            {
                Value = choiceValue,
                Language = constantSchema.Value.Language != null ?
                                constantSchema.Value.Language :
                                new Languages
                                {
                                    Default = new Language
                                    {
                                        Name = choiceValue,
                                    }
                                }
            };

            ChoiceSchema choiceSchema = new()
            {
                Type = AllSchemaTypes.Choice,
                ChoiceType = (PrimitiveSchema)constantSchema.ValueType,
                DefaultValue = constantSchema.DefaultValue,
                Language = constantSchema.Language,
                Choices = new[] { choice }
            };
            return choiceSchema;
        }
    }
}
