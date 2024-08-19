// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
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

        private static InputClient? CreateInputClient(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }
            id = id ?? throw new JsonException();

            var client = new InputClient();
            resolver.AddReference(id, client);

            string? name = null;
            string? description = null;
            IReadOnlyList<InputOperation>? operations = null;
            IReadOnlyList<InputParameter>? parameters = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            string? parent = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString(nameof(InputClient.Name), ref name)
                    || reader.TryReadString(nameof(InputClient.Description), ref description)
                    || reader.TryReadWithConverter(nameof(InputClient.Operations), options, ref operations)
                    || reader.TryReadWithConverter(nameof(InputClient.Parameters), options, ref parameters)
                    || reader.TryReadString(nameof(InputClient.Parent), ref parent)
                    || reader.TryReadWithConverter(nameof(InputClient.Decorators), options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            client.Name = name ?? throw new JsonException("InputClient must have name");
            client.Description = description ?? string.Empty;
            client.Operations = operations ?? Array.Empty<InputOperation>();
            client.Parameters = parameters ?? Array.Empty<InputParameter>();
            client.Parent = parent;
            client.Decorators = decorators ?? [];

            return client;
        }
    }
}
