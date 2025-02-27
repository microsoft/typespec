// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.Input.EmitterRpc;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputClientConverter : JsonConverter<InputClient>
    {
        private const string namespaceConflictCode = "client-namespace-conflict";

        private readonly Emitter _emitter;
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputClientConverter(TypeSpecReferenceHandler referenceHandler, Emitter emitter)
        {
            _emitter = emitter;
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
                var isKnownProperty = reader.TryReadString(nameof(InputClient.Name), ref name)
                    || reader.TryReadString("Namespace", ref @namespace)
                    || reader.TryReadString("Summary", ref summary)
                    || reader.TryReadString("Doc", ref doc)
                    || reader.TryReadWithConverter(nameof(InputClient.Operations), options, ref operations)
                    || reader.TryReadWithConverter(nameof(InputClient.Parameters), options, ref parameters)
                    || reader.TryReadString(nameof(InputClient.Parent), ref parent)
                    || reader.TryReadWithConverter(nameof(InputClient.Decorators), options, ref decorators)
                    || reader.TryReadString("CrossLanguageDefinitionId", ref crossLanguageDefinitionId);

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
                // invalid namespace segment found
                // report the diagnostic
                _emitter.ReportDiagnostic(namespaceConflictCode, $"namespace {client.Namespace} conflicts with client {client.Name}, please use `@clientName` to specify a different name for the client.", crossLanguageDefinitionId);
                // check if the list is already there
                // get the list out
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
