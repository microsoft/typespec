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
    /// </summary>
    internal static class ConfigurationSchemaGenerator
    {
        private static readonly JsonSerializerOptions s_jsonOptions = new()
        {
            WriteIndented = true
        };

        /// <summary>
        /// Generates the ConfigurationSchema.json content based on the output library's type providers.
        /// Returns null if no clients with <see cref="ClientSettingsProvider"/> are found.
        /// </summary>
        internal static string? Generate(OutputLibrary output)
        {
            var clientsWithSettings = output.TypeProviders
                .OfType<ClientProvider>()
                .Where(c => c.ClientSettings != null)
                .ToList();

            if (clientsWithSettings.Count == 0)
            {
                return null;
            }

            // Determine if Azure or SCM based on the options base type namespace.
            var optionsBaseType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.ClientPipelineOptionsType;
            bool isAzure = optionsBaseType.Namespace?.StartsWith("Azure", StringComparison.Ordinal) == true;
            string sectionName = isAzure ? "AzureClients" : "Clients";
            string optionsRef = isAzure ? "azureOptions" : "options";

            var schema = BuildSchema(clientsWithSettings, sectionName, optionsRef);
            return JsonSerializer.Serialize(schema, s_jsonOptions);
        }

        private static JsonObject BuildSchema(
            List<ClientProvider> clients,
            string sectionName,
            string optionsRef)
        {
            var clientProperties = new JsonObject();

            foreach (var client in clients)
            {
                var clientEntry = BuildClientEntry(client, optionsRef);
                clientProperties[client.Name] = clientEntry;
            }

            return new JsonObject
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
        }

        private static JsonObject BuildClientEntry(ClientProvider client, string optionsRef)
        {
            var settings = client.ClientSettings!;
            var properties = new JsonObject();

            // Add endpoint property
            if (settings.EndpointProperty != null)
            {
                properties[settings.EndpointProperty.Name] = BuildPropertySchema(settings.EndpointProperty);
            }

            // Add other required parameters
            foreach (var param in settings.OtherRequiredParams)
            {
                var propName = param.Name.ToIdentifierName();
                properties[propName] = GetJsonSchemaForType(param.Type);
            }

            // Add credential reference
            properties["Credential"] = new JsonObject
            {
                ["$ref"] = "#/definitions/credential"
            };

            // Add options
            properties["Options"] = BuildOptionsSchema(client, optionsRef);

            return new JsonObject
            {
                ["type"] = "object",
                ["description"] = $"Configuration for {client.Name}.",
                ["properties"] = properties
            };
        }

        private static JsonObject BuildOptionsSchema(ClientProvider client, string optionsRef)
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
                extensionProperties[prop.Name] = GetJsonSchemaForType(prop.Type);
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

        private static JsonObject BuildPropertySchema(PropertyProvider property)
        {
            var schema = GetJsonSchemaForType(property.Type);

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

        internal static JsonObject GetJsonSchemaForType(CSharpType type)
        {
            // Unwrap nullable types
            var effectiveType = type.IsNullable ? type.WithNullable(false) : type;

            // Handle non-framework types
            if (!effectiveType.IsFrameworkType)
            {
                if (effectiveType.IsEnum)
                {
                    return GetJsonSchemaForEnum(effectiveType);
                }

                return new JsonObject { ["type"] = "object" };
            }

            // Handle collection types
            if (effectiveType.IsList)
            {
                return BuildArraySchema(effectiveType);
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

        private static JsonObject GetJsonSchemaForEnum(CSharpType enumType)
        {
            var enumProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<EnumProvider>()
                .FirstOrDefault(e => e.Type.Equals(enumType));

            if (enumProvider == null)
            {
                // Try nested types (e.g., service version enums nested in options)
                enumProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                    .SelectMany(t => t.NestedTypes)
                    .OfType<EnumProvider>()
                    .FirstOrDefault(e => e.Type.Equals(enumType));
            }

            if (enumProvider != null)
            {
                var values = new JsonArray();
                foreach (var member in enumProvider.EnumValues)
                {
                    values.Add(JsonValue.Create(member.Value?.ToString()));
                }

                if (enumType.IsStruct)
                {
                    // Extensible enum — use anyOf to allow known values + custom strings
                    return new JsonObject
                    {
                        ["anyOf"] = new JsonArray
                        {
                            new JsonObject { ["enum"] = values },
                            new JsonObject { ["type"] = "string" }
                        }
                    };
                }

                // Fixed enum
                return new JsonObject { ["enum"] = values };
            }

            // Fallback: just string
            return new JsonObject { ["type"] = "string" };
        }

        private static JsonObject BuildArraySchema(CSharpType listType)
        {
            if (listType.Arguments.Count > 0)
            {
                return new JsonObject
                {
                    ["type"] = "array",
                    ["items"] = GetJsonSchemaForType(listType.Arguments[0])
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
