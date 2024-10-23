// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputNamespaceConverter : JsonConverter<InputNamespace>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputNamespaceConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputNamespace? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputNamespace(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputNamespace value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputNamespace? ReadInputNamespace(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;
            IReadOnlyList<string>? apiVersions = null;
            IReadOnlyList<InputEnumType>? enums = null;
            IReadOnlyList<InputModelType>? models = null;
            IReadOnlyList<InputClient>? clients = null;
            InputAuth? auth = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString(nameof(InputNamespace.Name), ref name)
                    || reader.TryReadWithConverter(nameof(InputNamespace.ApiVersions), options, ref apiVersions)
                    || reader.TryReadWithConverter(nameof(InputNamespace.Enums), options, ref enums)
                    || reader.TryReadWithConverter(nameof(InputNamespace.Models), options, ref models)
                    || reader.TryReadWithConverter(nameof(InputNamespace.Clients), options, ref clients)
                    || reader.TryReadWithConverter(nameof(InputNamespace.Auth), options, ref auth);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            apiVersions ??= Array.Empty<string>();
            enums ??= Array.Empty<InputEnumType>();
            models ??= Array.Empty<InputModelType>();
            clients ??= Array.Empty<InputClient>();
            // it is possible that no auth is defined in the typespec, in this case, we just create an empty auth.
            auth ??= new InputAuth();

            return new InputNamespace(
                name ?? throw new JsonException(),
                apiVersions,
                enums,
                models,
                clients,
                auth);
        }
    }
}
