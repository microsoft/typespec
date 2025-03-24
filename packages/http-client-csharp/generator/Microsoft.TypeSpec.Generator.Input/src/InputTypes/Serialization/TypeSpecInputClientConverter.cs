// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputClientConverter : JsonConverter<InputClient>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputClientConverter(TypeSpecReferenceHandler referenceHandler)
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
            IReadOnlyList<InputOperation>? operations = null;
            IReadOnlyList<InputParameter>? parameters = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            string? parent = null;
            string? crossLanguageDefinitionId = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref @namespace)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("operations", options, ref operations)
                    || reader.TryReadComplexType("parameters", options, ref parameters)
                    || reader.TryReadString("parent", ref parent)
                    || reader.TryReadComplexType("decorators", options, ref decorators)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId);

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
            client.Operations = operations ?? [];
            client.Parameters = parameters ?? [];
            client.Parent = parent;
            client.Decorators = decorators ?? [];

            var lastSegment = GetLastSegment(client.Namespace);
            if (lastSegment == client.Name)
            {
                // invalid namespace segment found, add it into the list
                var invalidNamespaceSegments = (List<string>)resolver.ResolveReference(TypeSpecSerialization.InvalidNamespaceSegmentsKey);
                invalidNamespaceSegments.Add(client.Name);
            }

            return client;
        }

        private static string GetLastSegment(string @namespace)
        {
            var span = @namespace.AsSpan();
            var index = span.LastIndexOf('.');
            if (index == -1)
            {
                return @namespace;
            }

            return span.Slice(index + 1).ToString();
        }
    }
}
