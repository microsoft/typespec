// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    /// <summary>
    /// Generates a ConfigurationSchema.json file for JSON IntelliSense support in appsettings.json.
    /// The schema defines well-known client names and their configuration properties.
    /// Common definitions (credential, options) are inherited from the System.ClientModel base schema
    /// and not duplicated here. Only additional types specific to the generated client (e.g., enums,
    /// custom models) are defined locally.
    /// </summary>
    internal static class ConfigurationSchemaGenerator
    {
        internal const string DefaultSectionName = "Clients";
        internal const string DefaultOptionsRef = "options";

        private static readonly JsonSerializerOptions s_jsonOptions = new()
        {
            WriteIndented = true
        };

        /// <summary>
        /// Generates the ConfigurationSchema.json content based on the output library's type providers.
        /// Returns null if no clients with <see cref="ClientSettingsProvider"/> are found.
        /// </summary>
        internal static string? Generate(OutputLibrary output, string sectionName = DefaultSectionName, string optionsRef = DefaultOptionsRef)
        {
            var clientsWithSettings = output.TypeProviders
                .OfType<ClientProvider>()
                .Where(c => c.ClientSettings != null)
                .ToList();

            if (clientsWithSettings.Count == 0)
            {
                return null;
            }

            var schema = BuildSchema(clientsWithSettings, sectionName, optionsRef);
            return JsonSerializer.Serialize(schema, s_jsonOptions);
        }

        private static JsonObject BuildSchema(
            List<ClientProvider> clients,
            string sectionName,
            string optionsRef)
        {
            // Collect local definitions for non-base types during schema generation
            var localDefinitions = new Dictionary<string, JsonObject>();
            var clientProperties = new JsonObject();

            foreach (var client in clients)
            {
                var clientEntry = BuildClientEntry(client, optionsRef, localDefinitions);
                clientProperties[client.Name] = clientEntry;
            }

            var schema = new JsonObject
            {
                ["$schema"] = "http://json-schema.org/draft-07/schema#",
                ["type"] = "object",
                ["properties"] = new JsonObject
                {
                    [sectionName] = new JsonObject
                    {
                        ["type"] = "object",
                        ["properties"] = clientProperties,
                        ["additionalProperties"] = new JsonObject
                        {
                            ["type"] = "object",
                            ["description"] = "Configuration for a named client instance."
                        }
                    }
                }
            };

            // Add local definitions only for types not covered by the base schema
            if (localDefinitions.Count > 0)
            {
                var definitions = new JsonObject();
                foreach (var (name, definition) in localDefinitions.OrderBy(kvp => kvp.Key))
                {
                    definitions[name] = definition;
                }
                schema["definitions"] = definitions;
            }

            return schema;
        }

        private static JsonObject BuildClientEntry(ClientProvider client, string optionsRef, Dictionary<string, JsonObject> localDefinitions)
        {
            var settings = client.ClientSettings!;
            var properties = new JsonObject();

            // Add endpoint property (Name is already transformed by PropertyProvider construction)
            if (settings.EndpointProperty != null)
            {
                properties[settings.EndpointProperty.Name] = BuildPropertySchema(settings.EndpointProperty, localDefinitions);
            }

            // Add other required parameters (raw param names need ToIdentifierName() for PascalCase)
            foreach (var param in settings.OtherRequiredParams)
            {
                var propName = param.Name.ToIdentifierName();
                properties[propName] = GetJsonSchemaForType(param.Type, localDefinitions);
            }

            // Add credential reference (defined in System.ClientModel base schema)
            properties["Credential"] = new JsonObject
            {
                ["$ref"] = "#/definitions/credential"
            };

            // Add options
            properties["Options"] = BuildOptionsSchema(client, optionsRef, localDefinitions);

            return new JsonObject
            {
                ["type"] = "object",
                ["description"] = $"Configuration for {client.Name}.",
                ["properties"] = properties
            };
        }

        private static JsonObject BuildOptionsSchema(ClientProvider client, string optionsRef, Dictionary<string, JsonObject> localDefinitions)
        {
            var clientOptions = client.EffectiveClientOptions;
            if (clientOptions == null)
            {
                return new JsonObject
                {
                    ["$ref"] = $"#/definitions/{optionsRef}"
                };
            }

            // Get client-specific option properties (public, non-version properties)
            var customProperties = clientOptions.Properties
                .Where(p => p.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                .ToList();

            if (customProperties.Count == 0)
            {
                return new JsonObject
                {
                    ["$ref"] = $"#/definitions/{optionsRef}"
                };
            }

            // Use allOf to extend the base options with client-specific properties
            var extensionProperties = new JsonObject();
            foreach (var prop in customProperties)
            {
                extensionProperties[prop.Name] = GetJsonSchemaForType(prop.Type, localDefinitions);
            }

            return new JsonObject
            {
                ["allOf"] = new JsonArray
                {
                    new JsonObject { ["$ref"] = $"#/definitions/{optionsRef}" },
                    new JsonObject
                    {
                        ["type"] = "object",
                        ["properties"] = extensionProperties
                    }
                }
            };
        }

        private static JsonObject BuildPropertySchema(PropertyProvider property, Dictionary<string, JsonObject> localDefinitions)
        {
            var schema = GetJsonSchemaForType(property.Type, localDefinitions);

            if (property.Description != null)
            {
                var descriptionText = property.Description.ToString();
                if (!string.IsNullOrEmpty(descriptionText))
                {
                    schema["description"] = descriptionText;
                }
            }

            return schema;
        }

        internal static JsonObject GetJsonSchemaForType(CSharpType type, Dictionary<string, JsonObject>? localDefinitions = null)
        {
            // Unwrap nullable types
            var effectiveType = type.IsNullable ? type.WithNullable(false) : type;

            // Handle non-framework types
            if (!effectiveType.IsFrameworkType)
            {
                if (effectiveType.IsEnum)
                {
                    return GetJsonSchemaForEnum(effectiveType, localDefinitions);
                }

                return new JsonObject { ["type"] = "object" };
            }

            // Handle collection types
            if (effectiveType.IsList)
            {
                return BuildArraySchema(effectiveType, localDefinitions);
            }

            var frameworkType = effectiveType.FrameworkType;

            if (frameworkType == typeof(string))
            {
                return new JsonObject { ["type"] = "string" };
            }
            if (frameworkType == typeof(bool))
            {
                return new JsonObject { ["type"] = "boolean" };
            }
            if (frameworkType == typeof(int) || frameworkType == typeof(long))
            {
                return new JsonObject { ["type"] = "integer" };
            }
            if (frameworkType == typeof(float) || frameworkType == typeof(double))
            {
                return new JsonObject { ["type"] = "number" };
            }
            if (frameworkType == typeof(Uri))
            {
                return new JsonObject { ["type"] = "string", ["format"] = "uri" };
            }
            if (frameworkType == typeof(TimeSpan))
            {
                return new JsonObject { ["type"] = "string" };
            }

            return new JsonObject { ["type"] = "object" };
        }

        private static JsonObject GetJsonSchemaForEnum(CSharpType enumType, Dictionary<string, JsonObject>? localDefinitions)
        {
            // Search both top-level and nested types (e.g., service version enums nested in options) in a single pass
            var enumProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SelectMany(t => new[] { t }.Concat(t.NestedTypes))
                .OfType<EnumProvider>()
                .FirstOrDefault(e => e.Type.Equals(enumType));

            if (enumProvider != null)
            {
                var values = new JsonArray();
                foreach (var member in enumProvider.EnumValues)
                {
                    values.Add(JsonValue.Create(member.Value?.ToString()));
                }

                JsonObject enumSchema;
                if (enumType.IsStruct)
                {
                    // Extensible enum — use anyOf to allow known values + custom strings
                    enumSchema = new JsonObject
                    {
                        ["anyOf"] = new JsonArray
                        {
                            new JsonObject { ["enum"] = values },
                            new JsonObject { ["type"] = "string" }
                        }
                    };
                }
                else
                {
                    // Fixed enum
                    enumSchema = new JsonObject { ["enum"] = values };
                }

                // Register as a local definition if we're collecting them
                if (localDefinitions != null)
                {
                    var definitionName = char.ToLowerInvariant(enumProvider.Name[0]) + enumProvider.Name.Substring(1);
                    if (!localDefinitions.ContainsKey(definitionName))
                    {
                        localDefinitions[definitionName] = enumSchema;
                    }
                    return new JsonObject { ["$ref"] = $"#/definitions/{definitionName}" };
                }

                return enumSchema;
            }

            // Fallback: just string
            return new JsonObject { ["type"] = "string" };
        }

        private static JsonObject BuildArraySchema(CSharpType listType, Dictionary<string, JsonObject>? localDefinitions)
        {
            if (listType.Arguments.Count > 0)
            {
                return new JsonObject
                {
                    ["type"] = "array",
                    ["items"] = GetJsonSchemaForType(listType.Arguments[0], localDefinitions)
                };
            }

            return new JsonObject
            {
                ["type"] = "array",
                ["items"] = new JsonObject { ["type"] = "string" }
            };
        }
    }
}
