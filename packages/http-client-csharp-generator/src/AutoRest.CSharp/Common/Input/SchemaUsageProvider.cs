// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Input
{
    internal class SchemaUsageProvider
    {
        private readonly CodeModel _codeModel;
        private readonly CachedDictionary<Schema, SchemaTypeUsage> _usages;

        public SchemaUsageProvider(CodeModel codeModel)
        {
            _codeModel = codeModel;
            _usages = new CachedDictionary<Schema, SchemaTypeUsage>(EnsureUsages);
        }

        private Dictionary<Schema, SchemaTypeUsage> EnsureUsages()
        {
            var usages = new Dictionary<Schema, SchemaTypeUsage>();
            foreach (var objectSchema in _codeModel.Schemas.Objects)
            {
                var usage = objectSchema?.Extensions?.Usage;

                if (usage != null)
                {
                    var schemaTypeUsage = (SchemaTypeUsage)Enum.Parse(typeof(SchemaTypeUsage), usage, true);

                    if (schemaTypeUsage.HasFlag(SchemaTypeUsage.Converter))
                    {
                        Apply(usages, objectSchema, SchemaTypeUsage.Converter, false);
                        schemaTypeUsage &= ~SchemaTypeUsage.Converter;
                    }

                    Apply(usages, objectSchema, schemaTypeUsage, true);
                }
            }
            foreach (var operationGroup in _codeModel.OperationGroups)
            {
                foreach (var operation in operationGroup.Operations)
                {
                    foreach (var operationResponse in operation.Responses)
                    {
                        var paging = operation.Language.Default.Paging;
                        if (paging != null && operationResponse.ResponseSchema is ObjectSchema objectSchema)
                        {
                            Apply(usages, operationResponse.ResponseSchema, SchemaTypeUsage.Output);
                            foreach (var property in objectSchema.Properties)
                            {
                                var itemName = paging.ItemName ?? "value";
                                if (property.SerializedName == itemName)
                                {
                                    Apply(usages, property.Schema, SchemaTypeUsage.Model | SchemaTypeUsage.Output);
                                }
                            }
                        }
                        else
                        {
                            Apply(usages, operationResponse.ResponseSchema, SchemaTypeUsage.Model | SchemaTypeUsage.Output);
                        }
                    }

                    foreach (var operationResponse in operation.Exceptions)
                    {
                        Apply(usages, operationResponse.ResponseSchema, SchemaTypeUsage.Error | SchemaTypeUsage.Output);
                    }

                    foreach (var parameter in operation.Parameters)
                    {
                        ApplyParameterSchema(usages, parameter);
                    }

                    foreach (var serviceRequest in operation.Requests)
                    {
                        foreach (var parameter in serviceRequest.Parameters)
                        {
                            ApplyParameterSchema(usages, parameter);
                        }
                    }
                }
            }

            return usages;
        }

        private void ApplyParameterSchema(Dictionary<Schema, SchemaTypeUsage> usages, RequestParameter parameter)
        {
            if (parameter.Flattened == true)
            {
                Apply(usages, parameter.Schema, SchemaTypeUsage.FlattenedParameters | SchemaTypeUsage.Input, recurse: false);
            }
            else
            {
                Apply(usages, parameter.Schema, SchemaTypeUsage.Model | SchemaTypeUsage.Input);
            }
        }

        private void Apply(Dictionary<Schema, SchemaTypeUsage> usages, Schema? schema, SchemaTypeUsage usage, bool recurse = true)
        {
            if (schema == null)
            {
                return;
            }

            usages.TryGetValue(schema, out var currentUsage);

            var newUsage = currentUsage | usage;
            if (newUsage == currentUsage)
            {
                return;
            }

            usages[schema] = newUsage;

            if (!recurse)
            {
                return;
            }

            if (schema is ObjectSchema objectSchema)
            {
                foreach (var parent in objectSchema.Parents!.All)
                {
                    Apply(usages, parent, usage);
                }

                foreach (var child in objectSchema.Children!.All)
                {
                    Apply(usages, child, usage);
                }

                foreach (var schemaProperty in objectSchema.Properties)
                {
                    var propertyUsage = usage;

                    if (schemaProperty.IsReadOnly)
                    {
                        propertyUsage &= ~SchemaTypeUsage.Input;
                    }

                    Apply(usages, schemaProperty.Schema, propertyUsage);
                }
            }
            else if (schema is DictionarySchema dictionarySchema)
            {
                Apply(usages, dictionarySchema.ElementType, usage);
            }
            else if (schema is ArraySchema arraySchema)
            {
                Apply(usages, arraySchema.ElementType, usage);
            }
            else if (schema is ConstantSchema constantSchmea)
            {
                // the value type of a ConstantSchema might be an choice (transformed in class AutoRest.CSharp.Mgmt.Decorator.Transformer.ConstantSchemaTransformer
                Apply(usages, constantSchmea.ValueType, usage);
            }
        }

        public SchemaTypeUsage GetUsage(Schema schema)
        {
            _usages.TryGetValue(schema, out var usage);
            return usage;
        }
    }

    [Flags]
    internal enum SchemaTypeUsage
    {
        None = 0,
        Input = 1,
        Output = Input << 1,
        RoundTrip = Input & Output,
        Model = Output << 1,
        Error = Model << 1,
        FlattenedParameters = Error << 1,
        Converter = FlattenedParameters << 1
    }
}
