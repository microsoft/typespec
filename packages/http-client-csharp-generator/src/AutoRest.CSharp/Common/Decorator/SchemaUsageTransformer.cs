// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Input;

namespace AutoRest.CSharp.Common.Decorator
{
    /// <summary>
    /// This class is used to transform usages for definitions listed in the "x-ms-format-element-type" property attribute.
    /// It must be run before the <see cref="DefaultDerivedSchema"/> transform (or any transforms that depend on the usages)
    /// so that the default derived schema logic is working with the correct usages.
    /// </summary>
    internal static class SchemaUsageTransformer
    {
        private const string FormatElementDefinition = "x-ms-format-element-type";
        private const string CSharpUsage = "x-csharp-usage";

        public static void Transform(CodeModel codeModel)
        {
            Dictionary<string, List<Property>> schemaToPropertyMap = new();
            Dictionary<string, List<Schema>> schemaToEnclosingSchemasMap = new();

            foreach (var schema in codeModel.AllSchemas.OfType<ObjectSchema>())
            {
                foreach (var property in schema.Properties)
                {
                    if (property.Extensions?.TryGetValue(FormatElementDefinition, out var value) == true)
                    {
                        string valueString = (string)value;

                        if (valueString.StartsWith("#/definitions/"))
                        {
                            valueString = valueString.Substring("#/definitions/".Length);
                        }

                        if (!schemaToPropertyMap.ContainsKey(valueString))
                        {
                            schemaToPropertyMap.Add(valueString, new List<Property>());
                        }

                        if (!schemaToEnclosingSchemasMap.ContainsKey(valueString))
                        {
                            schemaToEnclosingSchemasMap.Add(valueString, new List<Schema>());
                        }

                        schemaToPropertyMap[valueString].Add(property);
                        schemaToEnclosingSchemasMap[valueString].Add(schema);
                    }
                }
            }

            if (schemaToPropertyMap.Count == 0)
                return;

            foreach (var schema in codeModel.AllSchemas.OfType<ObjectSchema>())
            {
                if (!schemaToPropertyMap.TryGetValue(schema.Name, out var propertyList)) continue;

                schemaToPropertyMap.Remove(schema.Name);
                foreach (var property in propertyList)
                {
                    property.Extensions![FormatElementDefinition] = schema;
                }

                schema.Extensions ??= new RecordOfStringAndAny();

                // apply usages and media types based on the enclosing schemas for the properties that reference
                // the "x-ms-format-element-type" schema

                HashSet<string> additionalUsages = new();
                HashSet<KnownMediaType> additionalMediaTypes = new();
                foreach (var enclosingSchema in schemaToEnclosingSchemasMap[schema.Name])
                {
                    if (enclosingSchema is ObjectSchema objectSchema)
                    {
                        foreach (SchemaContext schemaUsage in objectSchema.Usage)
                        {
                            if (schemaUsage == SchemaContext.Exception) continue;
                            additionalUsages.Add(schemaUsage == SchemaContext.Input ? "input" : "output");
                        }

                        foreach (KnownMediaType mediaType in objectSchema.SerializationFormats)
                        {
                            additionalMediaTypes.Add(mediaType);
                        }
                    }
                }

                if (additionalUsages.Count > 0)
                {
                    // This is a hack to avoid needing to update the SchemaUsageProvider logic to look up the property schema using "x-ms-format-element-type"
                    // The problem with doing this here is that we don't know for sure if this should be a public model, but if we don't mark is as a model
                    // here then it will be generated as internal, since it will not necessarily be included in the SchemaUsageProvider logic that
                    // loops through model properties.
                    additionalUsages.Add("model");
                }

                // apply converter usage to any schemas that are referenced with "x-ms-format-element-type" in a property
                additionalUsages.Add("converter");

                // recursively apply the usages and media types to the schema and all property schemas on the schema
                Apply(schema, string.Join(",", additionalUsages), additionalMediaTypes, new HashSet<ObjectSchema>());
            }

            if (schemaToPropertyMap.Count > 0)
            {
                var schemaList = schemaToPropertyMap.Keys.Aggregate((a, b) => $"{a}, {b}");
                throw new InvalidOperationException($"The following schemas were referenced by properties with the '{FormatElementDefinition}' attribute, but were not found in any definitions: " + schemaList);
            }
        }

        private static void Apply(ObjectSchema schema, string usages, HashSet<KnownMediaType> mediaTypes, HashSet<ObjectSchema> appliedSchemas)
        {
            if (appliedSchemas.Contains(schema))
                return;

            appliedSchemas.Add(schema);


            schema.Extensions ??= new RecordOfStringAndAny();
            if (!schema.Extensions!.TryGetValue(CSharpUsage, out var existingUsages))
            {
                schema.Extensions.Add(CSharpUsage, usages);
            }
            else
            {
                if (existingUsages is string usage && !string.IsNullOrEmpty(usage))
                {
                    schema.Extensions![CSharpUsage] = usage + "," + usages;
                }
                else
                {
                    schema.Extensions![CSharpUsage] = usages;
                }
            }

            foreach (var mediaType in mediaTypes)
            {
                schema.SerializationFormats.Add(mediaType);
            }

            foreach (var property in schema.Properties)
            {
                if (property.Schema is ObjectSchema propertySchema)
                {
                    Apply(propertySchema, usages, mediaTypes, appliedSchemas);
                }
            }

            if (schema.Children != null)
            {
                foreach (var child in schema.Children!.Immediate)
                {
                    if (child is ObjectSchema propertySchema)
                    {
                        Apply(propertySchema, usages, mediaTypes, appliedSchemas);
                    }
                }
            }

            if (schema.Parents != null)
            {
                foreach (var parent in schema.Parents!.Immediate)
                {
                    if (parent is ObjectSchema propertySchema)
                    {
                        Apply(propertySchema, usages, mediaTypes, appliedSchemas);
                    }
                }
            }
        }
    }
}
