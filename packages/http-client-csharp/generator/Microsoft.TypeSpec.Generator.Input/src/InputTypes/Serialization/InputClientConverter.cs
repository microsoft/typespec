// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputClientConverter : JsonConverter<InputClient>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputClientConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputClient? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputClient>(_referenceHandler.CurrentResolver) ?? CreateInputClient(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputClient value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputClient? CreateInputClient(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }
            id = id ?? throw new JsonException();

            var client = new InputClient();
            resolver.AddReference(id, client);

            string? name = null;
            string? @namespace = null;
            string? summary = null;
            string? doc = null;
            IReadOnlyList<InputServiceMethod>? methods = null;
            IReadOnlyList<InputParameter>? parameters = null;
            int initializedByValue = 0;
            bool hasInitializedBy = false;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            string? crossLanguageDefinitionId = null;
            InputClient? parent = null;
            IReadOnlyList<InputClient>? children = null;
            IReadOnlyList<string>? apiVersions = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref @namespace)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("methods", options, ref methods)
                    || reader.TryReadComplexType("parameters", options, ref parameters)
                    || (hasInitializedBy = reader.TryReadInt32("initializedBy", ref initializedByValue))
                    || reader.TryReadComplexType("decorators", options, ref decorators)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadComplexType("parent", options, ref parent)
                    || reader.TryReadComplexType("children", options, ref children)
                    || reader.TryReadComplexType("apiVersions", options, ref apiVersions);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            client.Name = name ?? throw new JsonException("InputClient must have name");
            client.Namespace = @namespace ?? string.Empty;
            client.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;
            client.Summary = summary;
            client.Doc = doc;
            client.Methods = methods ?? [];
            client.Parameters = parameters ?? [];
            client.InitializedBy = hasInitializedBy ? (InputClientInitializedByFlags)initializedByValue : null;
            client.Decorators = decorators ?? [];
            client.Parent = parent;
            client.Children = children ?? [];
            client.ApiVersions = apiVersions ?? [];

            return client;
        }
    }
}
